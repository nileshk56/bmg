const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { availability, create, listMyBookings, listBookingsForListing } = require('../controllers/bookingController');

router.get('/availability', availability);
router.get('/my', authMiddleware, listMyBookings);
router.get('/listing/:listingId', authMiddleware, listBookingsForListing);
router.post('/', authMiddleware, create);

module.exports = router;
