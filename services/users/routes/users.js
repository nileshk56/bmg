const express = require('express');
const router = express.Router();
const {
  register,
  login,
  searchUsers,
  getUserById,
  getProfilePhotoUploadUrl,
  editUser
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get("/search", authMiddleware, searchUsers);
router.get('/:id', authMiddleware, getUserById);
router.post('/photo/presign', authMiddleware, getProfilePhotoUploadUrl);
router.put('/:id', authMiddleware, editUser);


// Protected route example
router.get('/me', /*authMiddleware,*/ (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
