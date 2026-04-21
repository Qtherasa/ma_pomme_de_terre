const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, 'data/vocabulary.json');

try {
  const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
  
  if (!Array.isArray(data)) throw new Error("Vocab must be an array.");

  const seenIds = new Set();

  data.forEach((entry, index) => {
    // 1. Check for required fields
    const requiredFields = ['id', 'fr', 'en', 'category', 'subcategory', 'type', 'emoji', 'lvl'];
    requiredFields.forEach(field => {
      if (entry[field] === undefined || entry[field] === null) {
        throw new Error(`Entry at index ${index} is missing the "${field}" field.`);
      }
    });

    // 2. Check if ID is unique
    if (seenIds.has(entry.id)) {
      throw new Error(`Duplicate ID found: "${entry.id}" at index ${index}. IDs must be unique.`);
    }
    seenIds.add(entry.id);
  });

  console.log(`✅ Success: ${data.length} entries validated. All IDs are unique!`);
} catch (err) {
  console.error("❌ Validation failed:", err.message);
  process.exit(1);
}