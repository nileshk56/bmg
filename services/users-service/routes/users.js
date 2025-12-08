import express from 'express';
import { signup, login, forgotPassword, resetPassword, verifyEmail } from '../controllers/UserController.js';
//import { upload } from '../utils/s3.js';

const router = express.Router();

/*router.post('/signup', upload.single('profilePic'), async (req, res, next) => {
  // if file uploaded, set req.body.profilePic = file.location
  if (req.file && req.file.location) req.body.profilePic = req.file.location;
  try { await signup(req, res); } catch(err){ next(err); }
});*/
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);

export default router;