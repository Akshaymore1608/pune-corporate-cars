const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const targetDir = path.join(__dirname, 'public', 'assets', 'cars');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const realCarImages = [
  {
    file: 'dzire.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg/960px-Suzuki_Dzire_II_1.2_GLX_Hybrid_Arctic_White_Pearl.jpg'
  },
  {
    file: 'aura.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Hyundai_Grand_i10_Sedan_2022_%2853703857804%29_%28cropped%29.jpg/960px-Hyundai_Grand_i10_Sedan_2022_%2853703857804%29_%28cropped%29.jpg'
  },
  {
    file: 'amaze.png',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Honda_Amaze_%28front%29.png/960px-Honda_Amaze_%28front%29.png'
  },
  {
    file: 'ertiga.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg/960px-Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg'
  },
  {
    file: 'rumion.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg/960px-Suzuki_Ertiga_NC_FL_1.5_GLX_Hybrid_Snow_White_Pearl.jpg'
  },
  {
    file: 'innova-crysta.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Toyota_Kijang_Innova_2.4_Venturer_GUN142R_%2820221231%29.jpg/960px-Toyota_Kijang_Innova_2.4_Venturer_GUN142R_%2820221231%29.jpg'
  },
  {
    file: 'innova-hycross.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/2023_Toyota_Zenix_2.0_v.jpg/960px-2023_Toyota_Zenix_2.0_v.jpg'
  },
  {
    file: 'fortuner.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/2015_Toyota_Fortuner_%28New_Zealand%29.jpg/960px-2015_Toyota_Fortuner_%28New_Zealand%29.jpg'
  },
  {
    file: 'mercedes-e220.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/2019_Mercedes-Benz_E220d_SE_Automatic_2.0_Front.jpg/960px-2019_Mercedes-Benz_E220d_SE_Automatic_2.0_Front.jpg'
  },
  {
    file: 'mercedes-e250.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Mercedes-Benz_W214_1X7A1841.jpg/960px-Mercedes-Benz_W214_1X7A1841.jpg'
  },
  {
    file: 'jaguar-xf.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/2018_Jaguar_XF_V6_S_Diesel_Automatic_3.0_Front.jpg/960px-2018_Jaguar_XF_V6_S_Diesel_Automatic_3.0_Front.jpg'
  },
  {
    file: 'bmw5.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/BMW_G60_520i_1X7A2443.jpg/960px-BMW_G60_520i_1X7A2443.jpg'
  },
  {
    file: 'bmw3.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/2019_BMW_318d_SE_Automatic_2.0_Front.jpg/960px-2019_BMW_318d_SE_Automatic_2.0_Front.jpg'
  },
  {
    file: 'camry.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/2018_Toyota_Camry_%28ASV70R%29_Ascent_sedan_%282018-08-27%29_01.jpg/960px-2018_Toyota_Camry_%28ASV70R%29_Ascent_sedan_%282018-08-27%29_01.jpg'
  },
  {
    file: 'carnival.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/2025_Kia_Carnival_Hybrid_EX%2C_front_right%2C_10-12-2025.jpg/960px-2025_Kia_Carnival_Hybrid_EX%2C_front_right%2C_10-12-2025.jpg'
  },
  {
    file: 'hero-car.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/2019_Mercedes-Benz_E220d_SE_Automatic_2.0_Front.jpg/960px-2019_Mercedes-Benz_E220d_SE_Automatic_2.0_Front.jpg'
  }
];

function downloadFile(item) {
  return new Promise((resolve) => {
    const dest = path.join(targetDir, item.file);
    const req = https.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Saved: ${item.file}`);
          resolve(true);
        });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (redRes) => {
          const fileStream = fs.createWriteStream(dest);
          redRes.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Saved (redirect): ${item.file}`);
            resolve(true);
          });
        }).on('error', () => resolve(false));
      } else {
        console.warn(`Failed ${item.file} status: ${res.statusCode}`);
        resolve(false);
      }
    });
    req.on('error', (e) => {
      console.error(`Error downloading ${item.file}:`, e.message);
      resolve(false);
    });
  });
}

async function run() {
  console.log('Downloading real car photography from official repositories...');
  for (const car of realCarImages) {
    await downloadFile(car);
  }
  console.log('Finished downloading real car images!');
}

run();

