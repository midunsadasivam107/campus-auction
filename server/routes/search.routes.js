const express = require('express');
const router = express.Router();

const {
  createSavedSearch,
  getMySavedSearches,
  deleteSavedSearch,
} = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', createSavedSearch);
router.get('/', getMySavedSearches);
router.delete('/:id', deleteSavedSearch);

module.exports = router;
