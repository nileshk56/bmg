const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { create, listByListing } = require('../controllers/reviewController');

router.get('/', listByListing);
router.post('/', authMiddleware, create);

module.exports = router;
