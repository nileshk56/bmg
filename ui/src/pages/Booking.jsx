import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE } from "../config/api.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function Booking() {
  const { listingId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: "2026-02-15",
    slotStart: "17:00",
    slotEnd: "18:00",
    guestCount: 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        listingId,
        date: form.date,
        slotStart: form.slotStart,
        slotEnd: form.slotEnd,
        guestCount: Number(form.guestCount),
      };

      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Booking failed. Please try again.");
      }

      const data = await response.json();
      const bookingId = data?.bookingId || data?.id || data?.booking?.bookingId;
      setSuccess(
        bookingId
          ? `Booking confirmed! Your booking id is ${bookingId}.`
          : "Booking confirmed!"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />

      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="fa-solid fa-calendar-check text-feast me-2"></i>
            Book a seat
          </h2>
          <Link className="btn btn-outline-secondary" to={`/listings/${listingId}`}>
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to listing
          </Link>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0 p-4 p-md-5">
              <h4 className="fw-semibold mb-4">
                <i className="fa-solid fa-user-group me-2 text-feast"></i>
                Booking details
              </h4>

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={update("date")}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Guests</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={form.guestCount}
                      onChange={update("guestCount")}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Slot start</label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.slotStart}
                      onChange={update("slotStart")}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Slot end</label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.slotEnd}
                      onChange={update("slotEnd")}
                      required
                    />
                  </div>
                </div>

                {error ? (
                  <div className="alert alert-danger mt-4 py-2 small">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="alert alert-success mt-4 py-2 small">
                    {success}
                  </div>
                ) : null}

                <div className="d-flex flex-column flex-md-row gap-3 mt-4">
                  <button
                    type="submit"
                    className="btn btn-feast px-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        Booking
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane me-2"></i>
                        Request booking
                      </>
                    )}
                  </button>
                  <Link
                    className="btn btn-outline-secondary px-4"
                    to="/home"
                  >
                    <i className="fa-solid fa-house me-2"></i>
                    Back to home
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
