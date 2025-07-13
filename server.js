const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/Inventory', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const inventorySchema = new mongoose.Schema({
  root: mongoose.Schema.Types.Mixed
});

const Inventory = mongoose.model('Inventory', inventorySchema, 'inventories');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Utility: Recursively search for item
function findItem(obj, target) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      if ('count' in obj[key] && key.toLowerCase() === target) {
        return { parent: obj, key };
      }
      const found = findItem(obj[key], target);
      if (found) return found;
    }
  }
  return null;
}

// GET all inventory
app.get('/inventory', async (req, res) => {
  const doc = await Inventory.findOne();
  if (!doc || !doc.root) {
    return res.status(500).json({ error: 'Inventory data not found' });
  }
  res.json(doc.root);
});

// GET: search for an item
app.get('/find', async (req, res) => {
  const itemToFind = req.query.item?.toLowerCase();
  const doc = await Inventory.findOne();

  if (!doc || !doc.root) {
    return res.status(500).json({ error: 'Inventory not available' });
  }

  const result = findItem(doc.root, itemToFind);
  if (!result) {
    return res.json({ error: "Item not found in inventory" });
  }

  res.json({ count: result.parent[result.key].count });
});

// POST: simulate purchase (update quantity)
// POST: simulate purchase (update quantity)
app.post('/purchase', async (req, res) => {
  const { item, qty } = req.body;
  const doc = await Inventory.findOne();

  if (!doc || !doc.root) {
    return res.status(500).json({ error: 'Inventory missing' });
  }

  const result = findItem(doc.root, item.toLowerCase());
  if (!result) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const current = result.parent[result.key].count;
  if (qty > current) {
    return res.status(400).json({ error: 'Not enough stock' });
  }

  result.parent[result.key].count -= qty;

  // Force Mongoose to recognize the change
  doc.markModified('root');
  await doc.save();

  res.json({ message: 'Purchase successful', remaining: result.parent[result.key].count });
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
