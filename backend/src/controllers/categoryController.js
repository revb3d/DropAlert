const { validationResult } = require('express-validator');
const CategoryWatch = require('../models/CategoryWatch');

const VALID_CATEGORIES = {
  electronics: 'Electronics',
  clothing:    'Clothing',
  sports:      'Sports & Outdoors',
  home:        'Home & Kitchen',
  books:       'Books',
  toys:        'Toys & Games',
  beauty:      'Beauty',
};

async function listWatches(req, res, next) {
  try {
    const watches = await CategoryWatch.getByUser(req.user.id);
    res.json({ watches });
  } catch (err) {
    next(err);
  }
}

async function createWatch(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { watchType = 'category', categoryKey, keyword, thresholdPercent = 10 } = req.body;

    let key, name, searchTerm;

    if (watchType === 'keyword') {
      if (!keyword || keyword.trim().length < 2) {
        return res.status(422).json({ error: 'Keyword must be at least 2 characters' });
      }
      const cleaned = keyword.trim();
      key = `kw_${cleaned.toLowerCase().replace(/\s+/g, '_').slice(0, 40)}`;
      name = cleaned;
      searchTerm = cleaned;
    } else {
      const categoryName = VALID_CATEGORIES[categoryKey];
      if (!categoryName) {
        return res.status(422).json({ error: `Invalid category: ${categoryKey}` });
      }
      key = categoryKey;
      name = categoryName;
      searchTerm = null;
    }

    const watch = await CategoryWatch.create(req.user.id, key, name, thresholdPercent, watchType, searchTerm);
    res.status(201).json({ watch });
  } catch (err) {
    next(err);
  }
}

async function deleteWatch(req, res, next) {
  try {
    const deleted = await CategoryWatch.remove(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Watch not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function updateWatch(req, res, next) {
  try {
    const { thresholdPercent, notifyEnabled } = req.body;
    const watch = await CategoryWatch.update(req.params.id, req.user.id, {
      thresholdPercent,
      notifyEnabled,
    });
    if (!watch) return res.status(404).json({ error: 'Watch not found' });
    res.json({ watch });
  } catch (err) {
    next(err);
  }
}

module.exports = { listWatches, createWatch, deleteWatch, updateWatch };
