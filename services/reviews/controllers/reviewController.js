const { createReview, listReviewsByListing, updateListingRating, getListingRating } = require('../services/reviewsService');

const create = async (req, res) => {
  try {
    const { listingId, bookingId, rating, comment } = req.body;
    if (!listingId) return res.status(400).json({ message: 'listingId is required' });

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5' });
    }

    const userId = req.user?.uid;
    const userName = [req.user?.firstname, req.user?.lastname].filter(Boolean).join(' ').trim();

    const review = await createReview({
      listingId,
      bookingId,
      rating: parsedRating,
      comment,
      userId,
      userName
    });

    await updateListingRating({ listingId, rating: parsedRating });

    res.json({ review });
  } catch (err) {
    if (err && err.code === 'ConditionalCheckFailedException') {
      return res.status(409).json({ message: 'User already reviewed this listing' });
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const listByListing = async (req, res) => {
  try {
    const { listingId, limit, nextToken } = req.query;
    if (!listingId) return res.status(400).json({ message: 'listingId is required' });

    const parseLimit = (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return 20;
      const safe = Math.floor(parsed);
      if (safe <= 0) return 20;
      return Math.min(safe, 100);
    };

    const decodeNextToken = (token) => {
      if (!token || typeof token !== 'string') return null;
      try {
        const json = Buffer.from(token, 'base64').toString('utf8');
        return JSON.parse(json);
      } catch (err) {
        return null;
      }
    };

    const encodeNextToken = (lastKey) => {
      if (!lastKey) return null;
      return Buffer.from(JSON.stringify(lastKey), 'utf8').toString('base64');
    };

    const pageSize = parseLimit(limit);
    const lastKey = decodeNextToken(nextToken);

    const result = await listReviewsByListing({ listingId, limit: pageSize, lastKey });
    const reviews = result.items;
    const listingRating = await getListingRating({ listingId });
    const totalReviews = listingRating?.ratingCount ?? reviews.length;
    const average =
      listingRating?.averageRating ??
      (totalReviews === 0
        ? 0
        : Number(
            (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(2)
          ));

    res.json({
      listingId,
      averageRating: average,
      totalReviews,
      reviews,
      nextToken: encodeNextToken(result.lastKey)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  create,
  listByListing
};
