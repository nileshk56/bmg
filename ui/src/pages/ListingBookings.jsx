import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ucFirst } from "../utils/textUtils.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function ListingBookings() {
  const { listingId } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [nextToken, setNextToken] = useState("");
  const [count, setCount] = useState(0);
  const [dateFilter, setDateFilter] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchBookings = async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      setBookings([]);
      setNextToken("");
      setCount(0);
      try {
        const params = new URLSearchParams();
        params.set("limit", "1");
        if (dateFilter) {
          params.set("date", dateFilter);
        }

        const bookingRes = await fetch(
          `http://localhost:3002/bookings/listing/${listingId}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
            },
          }
        );

        if (!bookingRes.ok) {
          throw new Error("Unable to load bookings for this listing.");
        }

        const bookingData = await bookingRes.json();

        if (active) {
          setBookings(bookingData?.bookings || []);
          setNextToken(bookingData?.nextToken || "");
          setCount(bookingData?.count || 0);
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

    fetchBookings();
    return () => {
      active = false;
    };
  }, [listingId, token, dateFilter]);

  const handleLoadMore = async () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", "1");
      params.set("nextToken", nextToken);
      if (dateFilter) {
        params.set("date", dateFilter);
      }

      const response = await fetch(
        `http://localhost:3002/bookings/listing/${listingId}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load more bookings.");
      }

      const data = await response.json();
      setBookings((prev) => [...prev, ...(data.bookings || [])]);
      setNextToken(data.nextToken || "");
      setCount(data.count || count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setDateFilter(dateInput);
  };

  return (
    <div>
      <NavBar />
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fa-solid fa-clipboard-list text-feast me-2"></i>
              Bookings for your listing
            </h2>
            <p className="text-muted mb-0">
              {count ? `• ${count} bookings` : ""}
            </p>
          </div>
          <Link className="btn btn-outline-secondary" to={`/listings/${listingId}`}>
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to listing
          </Link>
        </div>

        <form
          className="row g-2 align-items-end mb-4"
          onSubmit={handleFilterSubmit}
        >
          <div className="col-sm-6 col-md-4">
            <label className="form-label">Filter by date</label>
            <input
              type="date"
              className="form-control"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
            />
          </div>
          <div className="col-sm-6 col-md-4 d-flex gap-2">
            <button type="submit" className="btn btn-feast mt-3 mt-sm-0">
              <i className="fa-solid fa-filter me-2"></i>
              Apply filter
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary mt-3 mt-sm-0"
              onClick={() => {
                setDateInput("");
                setDateFilter("");
              }}
            >
              <i className="fa-solid fa-rotate-left me-2"></i>
              Clear
            </button>
          </div>
        </form>

        {loading ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-spinner fa-spin me-2"></i>
            Loading bookings...
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : null}

        {!loading && bookings.length === 0 ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-calendar-xmark me-2"></i>
            No bookings yet for this listing.
          </div>
        ) : null}

        <div className="row g-4">
          {bookings.map((booking) => (
            <div className="col-12" key={booking.bookingId || booking.id}>
              <div className="sacred-card h-100 p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-1">
                      <i className="fa-solid fa-user me-2 text-feast"></i>
                      {ucFirst(
                        booking.user?.firstname || booking.userName || "guest"
                      )}
                    </h5>
                    <div className="text-muted small">
                      <i className="fa-solid fa-calendar-day me-2"></i>
                      {booking.date} • {booking.slotStart} - {booking.slotEnd}
                    </div>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success">
                    {booking.status || "CONFIRMED"}
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-3 text-muted small">
                  <span>
                    <i className="fa-solid fa-users me-2"></i>
                    {booking.guestCount} guests
                  </span>
                  {booking.bookingId ? (
                    <span>
                      <i className="fa-solid fa-hashtag me-2"></i>
                      {booking.bookingId}
                    </span>
                  ) : null}
                </div>
                {booking.notes ? (
                  <p className="text-muted small mt-2 mb-0">
                    <i className="fa-solid fa-note-sticky me-2"></i>
                    {booking.notes}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {bookings.length > 0 ? (
          <div className="d-flex justify-content-center mt-4">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleLoadMore}
              disabled={!nextToken || loadingMore}
            >
              {loadingMore ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin me-2"></i>
                  Loading
                </>
              ) : nextToken ? (
                <>
                  <i className="fa-solid fa-chevron-down me-2"></i>
                  Load more
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-check me-2"></i>
                  No more results
                </>
              )}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
