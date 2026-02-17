import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import AreaInput from "../components/AreaInput.jsx";
import { AREAS } from "../data/areas.js";
import { toApiArea } from "../utils/areaUtils.js";

export default function Home() {
  const navigate = useNavigate();
  const [area, setArea] = useState("");
  const [pin, setPin] = useState("");
  const [searchMode, setSearchMode] = useState("area");

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchMode === "area" ? area.trim() : pin.trim();
    if (!query) return;
    const normalizedValue =
      searchMode === "area" ? toApiArea(query) : query;
    navigate(`/search?mode=${searchMode}&value=${encodeURIComponent(normalizedValue)}`);
  };

  return (
    <div>
      <NavBar />

      <section className="search-hero">
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <h1 className="display-5 fw-bold text-center mb-4">
                Book a chef’s table in {" "}
                <span className="text-feast">homes transformed into restaurants.</span>
              </h1>
              <p className="lead text-center mb-5">
                Feast together. Bond deeply. Share unforgettable tables.
              </p>
              

              <div className="card search-card border-0">
                <div className="card-body p-4">
                  <ul className="nav nav-pills search-tabs mb-4 justify-content-center">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${
                          searchMode === "area" ? "active" : ""
                        }`}
                        onClick={() => setSearchMode("area")}
                      >
                        <i className="fa-solid fa-location-dot me-2"></i>Search
                        by Area
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${
                          searchMode === "pin" ? "active" : ""
                        }`}
                        onClick={() => setSearchMode("pin")}
                      >
                        <i className="fa-solid fa-map-pin me-2"></i>Search by
                        PIN
                      </button>
                    </li>
                  </ul>

                  <div className="mb-3">
                    <form onSubmit={handleSearch}>
                      <div className="d-flex flex-column flex-sm-row gap-2">
                        <div className="flex-grow-1">
                          {searchMode === "area" ? (
                            <AreaInput
                              value={area}
                              onChange={setArea}
                              placeholder="Search by area like 'dadar', 'hsr'..."
                              inputClassName="form-control form-control-lg"
                              options={AREAS}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              placeholder="Search by PIN like '400067'..."
                              value={pin}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              onChange={(event) => setPin(event.target.value)}
                            />
                          )}
                        </div>
                        <button className="btn btn-feast btn-lg" type="submit">
                          <i className="fa-solid fa-magnifying-glass me-2"></i>
                          {searchMode === "area" ? "Search by area" : "Search by PIN"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      {searchMode === "area"
                        ? "Discover cultures through curated dining experiences."
                        : "Discover cultures through curated dining experiences."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container my-5">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-4">
            <div className="sacred-card h-100 p-4">
              <h4 className="fw-semibold mb-3">
                <i className="fa-solid fa-house-chimney me-2 text-feast"></i>
                Chef Tables
              </h4>
              <p className="text-muted mb-0">
                Homes become curated restaurants for one night only. Discover
                menus crafted for intimate, unforgettable evenings.
              </p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="sacred-card h-100 p-4">
              <h4 className="fw-semibold mb-3">
                <i className="fa-solid fa-earth-asia me-2 text-feast"></i>
                Cultural Journeys
              </h4>
              <p className="text-muted mb-0">
                Travel the world through curated dining experiences, hosted by
                locals who bring their traditions to the table.
              </p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="sacred-card h-100 p-4">
              <h4 className="fw-semibold mb-3">
                <i className="fa-solid fa-champagne-glasses me-2 text-feast"></i>
                Exclusive Seats
              </h4>
              <p className="text-muted mb-0">
                Seats are limited, memories are not. Secure your place at a
                hidden table before it disappears.
              </p>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-4">
          <div className="col-lg-7">
            <div className="sacred-card h-100 p-4">
              <h3 className="fw-bold mb-3">Every dinner is a destination.</h3>
              <p className="text-muted mb-3">
                From chef-led tasting menus to family-style feasts, each
                gathering is curated for curious diners seeking something
                extraordinary.
              </p>
              <button
                className="btn btn-feast"
                type="button"
                onClick={() => navigate("/search")}
              >
                <i className="fa-solid fa-magnifying-glass me-2"></i>
                Explore experiences
              </button>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="sacred-card h-100 p-4 home-cta-panel">
              <span className="badge rounded-pill text-bg-light mb-3">
                Curated Experiences
              </span>
              <h4 className="fw-bold mb-3">
                A restaurant you can’t Google.
              </h4>
              <p className="text-muted mb-4">
                Each home opens for a limited set of guests. Every seat feels
                like a discovery.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-feast bg-opacity-10 text-feast">
                  Invitation-only
                </span>
                <span className="badge bg-feast bg-opacity-10 text-feast">
                  Limited seats
                </span>
                <span className="badge bg-feast bg-opacity-10 text-feast">
                  Curated menus
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 mb-5 callout-feast">
        <div className="container text-center py-4">
          <h2 className="fw-bold mb-4">Want to host your own table?</h2>
          <p className="lead mb-4">
            List a lunch or dinner slot and welcome guests from your
            neighborhood.
          </p>
          <button
            className="btn btn-feast btn-lg px-5 py-3"
            type="button"
            onClick={() => navigate("/listings/new")}
          >
            <i className="fa-solid fa-bell-concierge me-2"></i>Start hosting
          </button>
        </div>
      </section>

      <div className="floating-nav">
        <button className="floating-nav-btn btn-feast d-flex align-items-center justify-content-center">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  );
}
