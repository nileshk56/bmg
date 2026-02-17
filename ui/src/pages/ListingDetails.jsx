import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ucFirst } from "../utils/textUtils.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function ListingDetails() {
  const { listingId } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [activePhoto, setActivePhoto] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsNextToken, setReviewsNextToken] = useState("");
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    comment: "",
  });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");

  const derivedAverage =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      : 0;
  const displayTotal = reviewsMeta.totalReviews || reviews.length;
  const displayAverage =
    reviewsMeta.totalReviews && reviewsMeta.averageRating
      ? reviewsMeta.averageRating
      : derivedAverage;

  useEffect(() => {
    let active = true;
    const fetchListing = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `http://localhost:3001/listings/${listingId}`,
          {
            headers: {
              Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load listing details.");
        }

        const data = await response.json();
        if (active) {
          setListing(data.listing);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchListing();
    return () => {
      active = false;
    };
  }, [listingId, token]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const response = await fetch(
        `http://localhost:3003/reviews?listingId=${encodeURIComponent(
          listingId
        )}&limit=2`,
        {
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load reviews.");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setReviewsMeta({
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
      });
      setReviewsNextToken(data.nextToken || "");
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [listingId, token]);

  const updateReview = (field) => (event) =>
    setReviewForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleAddReview = async (event) => {
    event.preventDefault();
    setReviewsError("");
    setReviewSuccess("");
    setReviewSaving(true);

    try {
      const rating = Number(reviewForm.rating);
      if (Number.isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
      }
      if (!reviewForm.comment.trim()) {
        throw new Error("Comment is required.");
      }

      const response = await fetch("http://localhost:3003/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          rating,
          comment: reviewForm.comment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit review.");
      }

      setReviewForm({ rating: "5", comment: "" });
      setReviewSuccess("Review submitted. Thank you!");
      await loadReviews();
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setReviewSaving(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!reviewsNextToken || reviewsLoadingMore) return;
    setReviewsLoadingMore(true);
    setReviewsError("");
    try {
      const response = await fetch(
        `http://localhost:3003/reviews?listingId=${encodeURIComponent(
          listingId
        )}&limit=2&nextToken=${encodeURIComponent(reviewsNextToken)}`,
        {
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load more reviews.");
      }

      const data = await response.json();
      setReviews((prev) => [...prev, ...(data.reviews || [])]);
      setReviewsMeta({
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
      });
      setReviewsNextToken(data.nextToken || "");
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setReviewsLoadingMore(false);
    }
  };

  return (
    <div>
      <NavBar />

      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fa-solid fa-plate-wheat text-feast me-2"></i>
              Listing details
            </h2>
            <p className="text-muted small mb-0">An invitation, not a reservation.</p>
          </div>
          <Link className="btn btn-outline-secondary" to="/home">
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to search
          </Link>
        </div>

        {loading ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-spinner fa-spin me-2"></i>
            Loading listing...
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : null}

        {listing ? (
          <div className="listing-details-layout">
            <div className="listing-left">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <h3 className="fw-bold mb-0">{ucFirst(listing.title)}</h3>
                    {displayTotal ? (
                      <span className="badge badge-soft-feast">
                        {displayAverage.toFixed(2)} ★ • {displayTotal} reviews
                      </span>
                    ) : (
                      <span className="badge badge-soft-feast">
                        No ratings yet
                      </span>
                    )}
                  </div>
                  <p className="text-muted mb-3">{ucFirst(listing.description)}</p>
                  <div className="d-flex flex-wrap gap-3 text-muted small mb-3">
                    <span>
                      <i className="fa-solid fa-location-dot me-2"></i>
                      {ucFirst(listing.address || listing.location)}
                    </span>
                    <span>
                      <i className="fa-solid fa-map me-2"></i>
                      {ucFirst(listing.area)}
                    </span>
                    <span>
                      <i className="fa-solid fa-hashtag me-2"></i>
                      {listing.pin || "—"}
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-3 mb-4">
                    <span className="badge badge-time">
                      <i className="fa-solid fa-clock me-2"></i>
                      {listing.openTime} - {listing.closeTime}
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success">
                      <i className="fa-solid fa-users me-2"></i>
                      {listing.slotCapacity} seats
                    </span>
                  </div>
                  <div className="listing-actions mb-4">
                    <Link
                      className="btn btn-feast"
                      to={`/bookings/new/${listing.listingId}`}
                    >
                      <i className="fa-solid fa-calendar-check me-2"></i>
                      Request booking
                    </Link>
                    <Link
                      className="btn btn-outline-secondary"
                      to={`/listings/${listing.listingId}/bookings`}
                    >
                      <i className="fa-solid fa-clipboard-list me-2"></i>
                      View bookings
                    </Link>
                  </div>

                  <div className="listing-photo-section">
                    <h4 className="fw-semibold mb-3">
                      <i className="fa-solid fa-images me-2 text-feast"></i>
                      Photos
                    </h4>
                    {listing.photos?.length ? (
                      <div className="listing-photo-grid">
                        {listing.photos.map((photoUrl, idx) => (
                          <div
                            className="listing-photo-item"
                            key={`${photoUrl}-${idx}`}
                          >
                            <button
                              type="button"
                              className="listing-photo-btn"
                              onClick={() => setActivePhoto(photoUrl)}
                            >
                              <img
                                src={photoUrl}
                                alt={`${ucFirst(listing.title)} ${idx + 1}`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="listing-photo-placeholder">
                        <i className="fa-solid fa-image"></i>
                        <span>No photos uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="listing-right">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h4 className="fw-semibold mb-3">
                    <i className="fa-solid fa-utensils me-2 text-feast"></i>
                    Menu items
                  </h4>
                  {listing.menuItems?.length ? (
                    <div className="list-group list-group-flush">
                      {listing.menuItems.map((item, idx) => (
                        <div
                          className="list-group-item d-flex justify-content-between align-items-start"
                          key={`${item.name}-${idx}`}
                        >
                          <div>
                        <div className="fw-semibold">{ucFirst(item.name)}</div>
                        <div className="text-muted small">
                          {ucFirst(item.description || "No description")}
                        </div>
                            {item.isHotDish ? (
                              <span className="badge bg-danger bg-opacity-10 text-danger mt-2">
                                <i className="fa-solid fa-fire me-1"></i>Hot
                              </span>
                            ) : null}
                          </div>
                          <div className="fw-semibold">{item.price}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">
                      No menu items added yet.
                    </div>
                  )}

                  <hr />

                  <div className="d-flex flex-column gap-2 text-muted small">
                    <span>
                      <i className="fa-solid fa-user me-2"></i>
                      Host: {ucFirst(listing.userName)}
                    </span>
                    <span>
                      <i className="fa-solid fa-clock-rotate-left me-2"></i>
                      Slot duration: {listing.slotDurationMinutes} mins
                    </span>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="fw-semibold mb-0">
                      <i className="fa-solid fa-star text-feast me-2"></i>
                      Reviews
                    </h4>
                    <span className="badge badge-soft-feast">
                      {displayTotal
                        ? `${displayAverage.toFixed(2)} ★ • ${displayTotal} reviews`
                        : "No ratings yet"}
                    </span>
                  </div>

                  {reviewsLoading ? (
                    <div className="text-muted small mb-3">
                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                      Loading reviews...
                    </div>
                  ) : null}

                  {reviewsError ? (
                    <div className="alert alert-danger py-2 small">
                      {reviewsError}
                    </div>
                  ) : null}

                  {reviews.length === 0 && !reviewsLoading ? (
                    <div className="text-muted small mb-3">
                      No reviews yet. Be the first to share your experience.
                    </div>
                  ) : null}

                  {reviews.map((review) => (
                    <div className="review-card mb-3" key={review.reviewId}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{ucFirst(review.userName)}</div>
                          <div className="text-muted small">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success">
                          {review.rating} ★
                        </span>
                      </div>
                      <p className="text-muted small mb-0 mt-2">
                        {ucFirst(review.comment)}
                      </p>
                    </div>
                  ))}

                  {reviewsNextToken ? (
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={loadMoreReviews}
                      disabled={reviewsLoadingMore}
                    >
                      {reviewsLoadingMore ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin me-2"></i>
                          Loading
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-chevron-down me-2"></i>
                          Load more reviews
                        </>
                      )}
                    </button>
                  ) : null}

                  <div className="mt-4">
                    <h5 className="fw-semibold mb-3">Add a review</h5>
                    <form onSubmit={handleAddReview}>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label">Rating</label>
                          <select
                            className="form-select"
                            value={reviewForm.rating}
                            onChange={updateReview("rating")}
                            required
                          >
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Great</option>
                            <option value="3">3 - Good</option>
                            <option value="2">2 - Fair</option>
                            <option value="1">1 - Poor</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label">Comment</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={reviewForm.comment}
                            onChange={updateReview("comment")}
                            placeholder="Share your experience..."
                            required
                          />
                        </div>
                      </div>
                      {reviewSuccess ? (
                        <div className="alert alert-success py-2 small mt-3">
                          {reviewSuccess}
                        </div>
                      ) : null}
                      <button
                        type="submit"
                        className="btn btn-feast mt-3"
                        disabled={reviewSaving}
                      >
                        {reviewSaving ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin me-2"></i>
                            Submitting
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane me-2"></i>
                            Submit review
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {activePhoto ? (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto("")}
        >
          <div
            className="photo-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-light photo-lightbox-close"
              onClick={() => setActivePhoto("")}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <img src={activePhoto} alt="Listing full" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
