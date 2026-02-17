import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ucFirst } from "../utils/textUtils.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function MyBookings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("http://localhost:3002/bookings/my", {
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load your bookings.");
        }

        const data = await response.json();
        const list = data?.bookings || data || [];

        const listingIds = list
          .map((booking) => booking.listingId)
          .filter(Boolean);

        const listingResponses = await Promise.all(
          listingIds.map((id) =>
            fetch(`http://localhost:3001/listings/${id}`, {
              headers: {
                Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
                "Content-Type": "application/json",
              },
            })
          )
        );

        const listingData = await Promise.all(
          listingResponses.map((res) => (res.ok ? res.json() : null))
        );

        const listingMap = new Map(
          listingData
            .map((payload) => payload?.listing)
            .filter(Boolean)
            .map((listing) => [listing.listingId, listing])
        );

        if (active) {
          const combined = list.map((booking) => ({
            ...booking,
            listing: listingMap.get(booking.listingId),
          }));
          setBookings(combined);
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
  }, [token]);

  return (
    <div>
      <NavBar />
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="fa-solid fa-calendar-check text-feast me-2"></i>
            My bookings
          </h2>
          <Link className="btn btn-outline-secondary" to="/home">
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to search
          </Link>
        </div>

        {loading ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-spinner fa-spin me-2"></i>
            Loading your bookings...
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : null}

        {!loading && bookings.length === 0 ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-calendar-xmark me-2"></i>
            No bookings yet.
          </div>
        ) : null}

        <div className="row g-4">
          {bookings.map((booking) => (
            <div className="col-12" key={booking.bookingId || booking.id}>
              <div className="sacred-card h-100 p-3">
                <div className="row g-3 align-items-center">
                  <div className="col-md-4">
                    <img
                      src={booking.listing?.photos?.[0]}
                      className="img-fluid w-100 rounded-3"
                      style={{ height: "200px", objectFit: "cover" }}
                      alt={booking.listing?.title || "Listing"}
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h4 className="mb-0">
                        {ucFirst(booking.listing?.title || "Listing")}
                      </h4>
                      <span className="badge bg-success bg-opacity-10 text-success">
                        <i className="fa-solid fa-circle-check me-1"></i>
                        {booking.status || "CONFIRMED"}
                      </span>
                    </div>
                    <p className="text-muted small mb-2">
                      <i className="fa-solid fa-location-dot text-danger me-1"></i>
                      {ucFirst(
                        booking.listing?.address || booking.listing?.location || "-"
                      )}{" "}
                      | {ucFirst(booking.listing?.area || "-")}
                    </p>
                    <div className="d-flex flex-wrap gap-3 mb-2 text-muted small">
                      <span>
                        <i className="fa-solid fa-calendar-day me-2"></i>
                        {booking.date}
                      </span>
                      <span>
                        <i className="fa-solid fa-clock me-2"></i>
                        {booking.slotStart} - {booking.slotEnd}
                      </span>
                      <span>
                        <i className="fa-solid fa-users me-2"></i>
                        {booking.guestCount} guests
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <Link
                        to={`/listings/${booking.listingId}`}
                        className="btn btn-sm btn-feast"
                      >
                        <i className="fa-solid fa-circle-info me-1"></i>
                        View listing
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="fa-solid fa-phone me-1"></i>
                        Contact host
                      </button>
                      {booking.bookingId ? (
                        <span className="badge bg-secondary bg-opacity-10 text-muted align-self-center">
                          Booking ID {booking.bookingId}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
