import fs from 'fs';
import path from 'path';

const enPath = path.join(process.cwd(), 'src', 'locales', 'en.json');
const frPath = path.join(process.cwd(), 'src', 'locales', 'fr.json');

try {
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));

  const enKeys = Object.keys(enData).sort();
  const frKeys = Object.keys(frData).sort();

  const missingInFr = enKeys.filter(key => !frKeys.includes(key));
  const missingInEn = frKeys.filter(key => !enKeys.includes(key));

  console.log('🔍 Locale Symmetry Check');
  console.log('========================');

  if (missingInFr.length === 0 && missingInEn.length === 0) {
    console.log('✅ Perfect! Both locale files have the same keys.');
    console.log(`📊 Total keys: ${enKeys.length}`);
  } else {
    if (missingInFr.length > 0) {
      console.log('❌ Missing in French locale:');
      missingInFr.forEach(key => console.log(`   - ${key}`));
    }
    
    if (missingInEn.length > 0) {
      console.log('❌ Missing in English locale:');
      missingInEn.forEach(key => console.log(`   - ${key}`));
    }
    
    console.log(`\n📊 English keys: ${enKeys.length}`);
    console.log(`📊 French keys: ${frKeys.length}`);
  }

  process.exit(missingInFr.length === 0 && missingInEn.length === 0 ? 0 : 1);
} catch (error) {
  console.error('❌ Error checking locale files:', error.message);
  process.exit(1);
} 