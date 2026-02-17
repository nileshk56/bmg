import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import HostCard from "../components/HostCard.jsx";
import AreaInput from "../components/AreaInput.jsx";
import { AREAS } from "../data/areas.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toApiArea } from "../utils/areaUtils.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function Search() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode =
    searchParams.get("mode") === "pin" ? "pin" : "area";
  const initialValue = searchParams.get("value") || "";

  const [area, setArea] = useState(
    initialMode === "area" ? initialValue : ""
  );
  const [pin, setPin] = useState(initialMode === "pin" ? initialValue : "");
  const [searchMode, setSearchMode] = useState(initialMode);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchKey, setSearchKey] = useState(initialMode);
  const [searchValue, setSearchValue] = useState(
    initialValue ? initialValue : ""
  );
  const [error, setError] = useState("");

  const listingsToShow = useMemo(
    () =>
      results.map((listing) => ({
        id: listing.listingId,
        tag: listing.status === "ACTIVE" ? "Active" : listing.status,
        image: listing.photos?.[0],
        title: listing.title,
        distance: listing.areaKey || listing.area,
        area: listing.address || listing.location,
        rating: listing.userName,
        reviews: `${listing.slotCapacity} seats`,
        slot: `Open ${listing.openTime} - ${listing.closeTime}`,
        slotClass: "text-success bg-success",
        description: listing.description,
        currency: listing.currency,
        menuItems: listing.menuItems || [],
      })),
    [results]
  );

  const runSearch = async (mode, rawQuery) => {
    setError("");
    setLoading(true);
    setResults([]);
    setNextToken("");
    setHasSearched(false);

    try {
      const query = rawQuery.trim();
      if (!query) {
        throw new Error(
          mode === "area"
            ? "Please enter an area to search."
            : "Please enter a PIN to search."
        );
      }

      const normalizedValue = mode === "area" ? toApiArea(query) : query;
      setSearchKey(mode);
      setSearchValue(normalizedValue);
      setSearchParams({ mode, value: normalizedValue });

      const response = await fetch(
        `http://localhost:3001/listings/search?${encodeURIComponent(
          mode
        )}=${encodeURIComponent(normalizedValue)}&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed. Please try again.");
      }

      const data = await response.json();
      setResults(data.listings || []);
      setNextToken(data.nextToken || "");
      setHasSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchMode === "area" ? area : pin;
    runSearch(searchMode, query);
  };

  const handleLoadMore = async () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3001/listings/search?${encodeURIComponent(
          searchKey
        )}=${encodeURIComponent(searchValue)}&limit=10&nextToken=${encodeURIComponent(
          nextToken
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load more listings.");
      }

      const data = await response.json();
      setResults((prev) => [...prev, ...(data.listings || [])]);
      setNextToken(data.nextToken || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (initialValue) {
      runSearch(initialMode, initialValue);
    }
  }, []);

  return (
    <div>
      <NavBar />

      <section className="search-hero">
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <h1 className="display-5 fw-bold text-center mb-4">
                Book a chef’s table, not a{" "}
                <span className="text-feast">restaurant table</span>
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
                          {loading ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin me-2"></i>
                              Searching
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-magnifying-glass me-2"></i>
                              {searchMode === "area"
                                ? "Search by area"
                                : "Search by PIN"}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    {error ? (
                      <div className="alert alert-danger mt-3 py-2 small">
                        {error}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Discover cultures through curated dining experiences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container my-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-3 mb-md-0">
            <i className="fa-solid fa-magnifying-glass text-feast me-2"></i>
            Search results
          </h2>
        </div>

        {!hasSearched ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-circle-info me-2"></i>
            Start searching by area or PIN to see available hosts.
          </div>
        ) : null}

        <div className="row g-4">
          {hasSearched && listingsToShow.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-light text-center">
                <i className="fa-solid fa-face-frown me-2"></i>
                {searchKey === "area"
                  ? "No listings found for that area."
                  : "No listings found for that PIN."}
              </div>
            </div>
          ) : (
            listingsToShow.map((host) => (
              <HostCard
                key={host.id}
                host={host}
                onOpen={(listingId) => navigate(`/listings/${listingId}`)}
              />
            ))
          )}
        </div>

        {hasSearched && listingsToShow.length > 0 ? (
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
