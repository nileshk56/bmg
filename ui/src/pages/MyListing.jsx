import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ucFirst } from "../utils/textUtils.js";
import { API_BASE } from "../config/api.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1NDQ1NzUsImV4cCI6MTc3MDU0ODE3NX0.X4R-Df4JgRKrcDZH6nwtN-yz8s-lbwZ07EU2p336W48";

export default function MyListing() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let active = true;

    const fetchListing = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/listings/my`, {
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load your listing.");
        }

        const data = await response.json();
        const list = data?.listings || (data?.listing ? [data.listing] : []);

        if (active) {
          setListings(list);
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
  }, [token]);

  const handleDelete = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This action cannot be undone."
    );
    if (!confirmed) return;
    setActionMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/listings/${listingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete listing.");
      }

      setListings((prev) => prev.filter((item) => item.listingId !== listingId));
      setActionMessage("Listing deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <NavBar />

      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="fa-solid fa-utensils text-feast me-2"></i>
            My listing
          </h2>
          <Link className="btn btn-outline-secondary" to="/home">
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to home
          </Link>
        </div>

        {loading ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-spinner fa-spin me-2"></i>
            Loading your listing...
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : null}
        {actionMessage ? (
          <div className="alert alert-success text-center">{actionMessage}</div>
        ) : null}

        {!loading && listings.length === 0 ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-circle-info me-2"></i>
            No listing found for your account.
          </div>
        ) : null}

        <div className="row g-4">
          {listings.map((listing) => (
            <div className="col-12" key={listing.listingId}>
              <div className="sacred-card h-100 p-3">
                <div className="row g-3 align-items-center">
                  <div className="col-md-4">
                    <img
                      src={listing.photos?.[0]}
                      className="img-fluid w-100 rounded-3"
                      style={{ height: "200px", objectFit: "cover" }}
                      alt={listing.title}
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h4 className="mb-0">{ucFirst(listing.title)}</h4>
                      <span className="badge bg-success bg-opacity-10 text-success">
                        <i className="fa-solid fa-circle-check me-1"></i>
                        {listing.status || "ACTIVE"}
                      </span>
                    </div>
                    <p className="text-muted small mb-2">
                      <i className="fa-solid fa-location-dot text-danger me-1"></i>
                      {ucFirst(listing.address || listing.location)} | {ucFirst(listing.area)}
                    </p>
                    <div className="d-flex flex-wrap gap-3 text-muted small mb-3">
                      <span>
                        <i className="fa-solid fa-clock me-2"></i>
                        {listing.openTime} - {listing.closeTime}
                      </span>
                      <span>
                        <i className="fa-solid fa-users me-2"></i>
                        {listing.slotCapacity} seats
                      </span>
                    </div>
                    <p className="text-muted small mb-3">{ucFirst(listing.description)}</p>
                    <div className="d-flex flex-wrap gap-2">
                      <Link
                        to={`/listings/${listing.listingId}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="fa-solid fa-circle-info me-1"></i>
                        View details
                      </Link>
                      <Link
                        to={`/listings/${listing.listingId}/edit`}
                        className="btn btn-sm btn-feast"
                      >
                        <i className="fa-solid fa-pen-to-square me-1"></i>
                        Edit listing
                      </Link>
                      <Link
                        to={`/listings/${listing.listingId}/bookings`}
                        className="btn btn-sm btn-feast"
                      >
                        <i className="fa-solid fa-clipboard-list me-1"></i>
                        Show bookings
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(listing.listingId)}
                      >
                        <i className="fa-solid fa-trash me-1"></i>
                        Delete
                      </button>
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
