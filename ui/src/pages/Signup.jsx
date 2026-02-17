import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api.js";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidEmail = (value) =>
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
      value.trim()
    );

  const isValidDob = (value) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    return date <= today;
  };

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const emailInvalid = emailTouched && !isValidEmail(form.email);

  const isValidPassword = (value) => /^[a-zA-Z0-9]{5,20}$/.test(value);
  const passwordInvalid =
    form.password.length > 0 && !isValidPassword(form.password);
  const confirmPasswordInvalid =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      setEmailTouched(true);
      if (!form.firstname.trim()) {
        throw new Error("First name is required.");
      }
      if (!form.lastname.trim()) {
        throw new Error("Last name is required.");
      }
      if (!form.email.trim() || !isValidEmail(form.email)) {
        throw new Error("Please enter a valid email address.");
      }
      if (!isValidPassword(form.password)) {
        throw new Error("Password must be 5 to 20 alphanumeric characters.");
      }
      if (form.confirmPassword !== form.password) {
        throw new Error("Passwords do not match.");
      }
      if (!form.gender) {
        throw new Error("Please select a gender.");
      }
      if (!isValidDob(form.dob)) {
        throw new Error("Please enter a valid birthdate.");
      }

      const response = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          password: form.password,
          gender: form.gender,
          dob: form.dob,
        }),
      });

      if (!response.ok) {
        throw new Error("Signup failed. Please check your details.");
      }

      setSuccess("Account created! Please log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              <i className="fa-solid fa-user-plus me-2"></i>Easy sign up
            </span>
            <span>
              <i className="fa-solid fa-bell-concierge me-2"></i>Host dinners
            </span>
            <span>
              <i className="fa-solid fa-heart me-2"></i>Grow community
            </span>
          </div>
        </div>
      </div>

      <div className="login-form flex-grow-1 d-flex align-items-center">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-7">
              <div className="card border-0 shadow-lg p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="login-icon mx-auto mb-3">
                    <i className="fa-solid fa-user-plus"></i>
                  </div>
                  <h2 className="fw-bold">Create your account</h2>
                  <p className="text-muted mb-0">
                    Sign up to book and host home-cooked meals.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First name</label>
                      <input
                        className="form-control"
                        value={form.firstname}
                        onChange={update("firstname")}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last name</label>
                      <input
                        className="form-control"
                        value={form.lastname}
                        onChange={update("lastname")}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={update("email")}
                        onBlur={() => setEmailTouched(true)}
                        required
                      />
                      {emailInvalid ? (
                        <div className="text-danger small mt-1">
                          Please enter a valid email address.
                        </div>
                      ) : null}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.password}
                        onChange={update("password")}
                        minLength={5}
                        maxLength={20}
                        pattern="[a-zA-Z0-9]{5,20}"
                        required
                      />
                      {passwordInvalid ? (
                        <div className="text-danger small mt-1">
                          Password must be 5 to 20 alphanumeric characters.
                        </div>
                      ) : null}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Confirm password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.confirmPassword}
                        onChange={update("confirmPassword")}
                        minLength={5}
                        maxLength={20}
                        pattern="[a-zA-Z0-9]{5,20}"
                        required
                      />
                      {confirmPasswordInvalid ? (
                        <div className="text-danger small mt-1">
                          Passwords do not match.
                        </div>
                      ) : null}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        value={form.gender}
                        onChange={update("gender")}
                        required
                      >
                        <option value="" disabled>
                          Select gender
                        </option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date of birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.dob}
                        onChange={update("dob")}
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

                  <button
                    type="submit"
                    className="btn btn-feast w-100 mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        Creating account
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-user-plus me-2"></i>
                        Sign up
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4 small text-muted">
                  Already have an account?{" "}
                  <Link to="/login" className="text-feast fw-semibold">
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
