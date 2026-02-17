const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const {
  create,
  getById,
  list,
  listMy,
  getListingPhotoUploadUrl,
  search,
  update,
  remove
} = require('../controllers/listingController');

router.get('/', list);
router.get('/my', authMiddleware, listMy);
router.post('/photos/presign', authMiddleware, getListingPhotoUploadUrl);
router.get('/search', search);
router.get('/:id', getById);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
