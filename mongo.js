// load_inventory.js

const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect('mongodb://localhost:27017/Inventory', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const inventorySchema = new mongoose.Schema({
  root: mongoose.Schema.Types.Mixed
});

const Inventory = mongoose.model('Inventory', inventorySchema, 'inventories'); // Explicit collection name

(async () => {
  try {
    const raw = fs.readFileSync('./inventory.json', 'utf-8');
    const data = JSON.parse(raw);

    // Clear existing data (optional)
    await Inventory.deleteMany({});

    const doc = await Inventory.create(data);
    console.log('✅ Inventory inserted successfully!');
    console.log(JSON.stringify(doc, null, 2));
  } catch (err) {
    console.error('❌ Error inserting inventory:', err);
  } finally {
    mongoose.disconnect();
  }
})();
