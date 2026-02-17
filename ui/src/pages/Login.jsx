import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (value) =>
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
      value.trim()
    );

  const decodeJwt = (token) => {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (err) {
      return null;
    }
  };

  const emailInvalid = emailTouched && !isValidEmail(email);

  const isValidPassword = (value) => /^[a-zA-Z0-9]{5,20}$/.test(value);

  const passwordInvalid = password.length > 0 && !isValidPassword(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      setEmailTouched(true);
      if (!email.trim() || !isValidEmail(email)) {
        throw new Error("Please enter a valid email address.");
      }
      if (!isValidPassword(password)) {
        throw new Error("Password must be 5 to 20 alphanumeric characters.");
      }

      const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed. Check your email and password.");
      }

      const data = await response.json();
      const jwtToken = data?.token || data?.jwt || data?.accessToken;
      const claims = decodeJwt(jwtToken);
      const derivedUser = {
        firstname:
          claims?.firstname ||
          claims?.firstName ||
          claims?.given_name ||
          email,
        lastname:
          claims?.lastname || claims?.lastName || claims?.family_name || "",
        userType:
          (claims?.userType ||
            claims?.user_type ||
            claims?.role ||
            claims?.type ||
            "")
            .toUpperCase() || undefined,
        email: claims?.email || email,
        uid: claims?.uid || claims?.sub,
      };
      login({ user: derivedUser, token: jwtToken });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthed) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="login-wrap min-vh-100 d-flex align-items-stretch">
      <div className="login-art d-none d-lg-flex flex-column justify-content-between">
        <div className="p-4">
          <span className="badge rounded-pill text-bg-light">
            <i className="fa-solid fa-house-chimney-window me-2"></i>
            HomeFeast
          </span>
        </div>
        <div className="p-4">
          <h1 className="display-5 fw-bold text-white mb-3">
            Homes transform into
            <br />
            unforgettable restaurants.
          </h1>
          <p className="text-white-50 mb-4">
            Discover cultures through curated dining experiences.
          </p>
          <div className="d-flex gap-3 text-white-50">
            <span>
              <i className="fa-solid fa-utensils me-2"></i>Host meals
            </span>
            <span>
              <i className="fa-solid fa-calendar-check me-2"></i>Book slots
            </span>
            <span>
              <i className="fa-solid fa-star me-2"></i>Trusted reviews
            </span>
          </div>
        </div>
      </div>

      <div className="login-form flex-grow-1 d-flex align-items-center">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-9 col-lg-6">
              <div className="mobile-login-message d-lg-none text-center mb-4">
                Book a chef's table at home transformed into a theme restaurant.
              </div>
              <div className="card border-0 shadow-lg p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="login-icon mx-auto mb-3">
                    <i className="fa-solid fa-bowl-rice"></i>
                  </div>
                  <h2 className="fw-bold">Welcome back</h2>
                  <p className="text-muted mb-0">
                    Log in to manage your home feasts and bookings.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fa-solid fa-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    {emailInvalid ? (
                      <div className="text-danger small mt-1">
                        Please enter a valid email address.
                      </div>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fa-solid fa-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        minLength={5}
                        maxLength={20}
                        pattern="[a-zA-Z0-9]{5,20}"
                        required
                      />
                    </div>
                    {passwordInvalid ? (
                      <div className="text-danger small mt-1">
                        Password must be 5 to 20 alphanumeric characters.
                      </div>
                    ) : null}
                  </div>

                  {error ? (
                    <div className="alert alert-danger py-2 small">{error}</div>
                  ) : null}

                  <button
                    type="submit"
                    className="btn btn-feast w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        Signing in
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-right-to-bracket me-2"></i>
                        Sign in
                      </>
                    )}
                  </button>
                </form>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <span className="text-muted small">
                    <i className="fa-regular fa-circle-question me-2"></i>
                    Need help?
                  </span>
                  <Link to="/signup" className="text-feast fw-semibold small">
                    Create account
                  </Link>
                </div>
              </div>

              <div className="text-center mt-4 text-muted small">
                <i className="fa-solid fa-plate-wheat me-2"></i>
                New to HomeFeast?{" "}
                <Link to="/signup" className="text-feast fw-semibold">
                  Sign up here
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
