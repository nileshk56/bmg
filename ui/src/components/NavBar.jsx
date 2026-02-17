import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ucFirst } from "../utils/textUtils.js";

export default function NavBar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const userName = ucFirst(user?.firstname || "guest");
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sacred-header sticky-top">
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          <a className="navbar-brand" href="/home">
            House of feast
          </a>
          <div className="d-flex order-lg-2 ms-auto align-items-center gap-2">
            <Link
              to="/listings/new"
              className="btn btn-feast d-none d-md-inline-flex"
            >
              <i className="fa-solid fa-utensils me-2"></i>
              Add restaurant listing
            </Link>
            <div className="dropdown">
              <button
                className="btn user-menu-btn dropdown-toggle d-inline-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span className="user-avatar">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={userName} />
                  ) : (
                    userInitial
                  )}
                </span>
                <span className="user-name">{userName}</span>
                <i className="fa-solid fa-chevron-down ms-2"></i>
              </button>
              {/* User menu dropdown */}
              <ul className="dropdown-menu dropdown-menu-end user-menu-panel">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="fa-solid fa-user-gear me-2"></i>
                    Profile settings
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/my-bookings">
                    <i className="fa-solid fa-calendar-check me-2"></i>
                    Your bookings
                  </Link>
                </li>
                {(user?.userType || "").toUpperCase() === "HOST" ? (
                  <li>
                    <Link className="dropdown-item" to="/my-listing">
                      <i className="fa-solid fa-utensils me-2"></i>
                      My listing
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link className="dropdown-item" to="/listings/new">
                    <i className="fa-solid fa-bowl-food me-2"></i>
                    Add listing
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    type="button"
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            { /** 
             * <ul className="navbar-nav mx-auto">
              <li className="nav-item mx-2">
                <Link className="nav-link active" to="/search">
                  <i className="fa-solid fa-magnifying-glass me-1"></i> Explore
                </Link>
              </li>
              <li className="nav-item mx-2">
                <Link className="nav-link" to="/listings/new">
                  <i className="fa-solid fa-circle-plus me-1"></i> Add Listing
                </Link>
              </li>
              <li className="nav-item mx-2">
                <a className="nav-link" href="#">
                  <i className="fa-solid fa-calendar-check me-1"></i> Bookings
                </a>
              </li>
              <li className="nav-item mx-2">
                <a className="nav-link" href="#">
                  <i className="fa-solid fa-hands-helping me-1"></i> Hosts
                </a>
              </li>
              <li className="nav-item mx-2">
                <a className="nav-link" href="#">
                  <i className="fa-solid fa-star me-1"></i> Reviews
                </a>
              </li>
            </ul>
            */}
          </div>
        </div>
      </nav>
    </header>
  );
}
