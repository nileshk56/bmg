import { ucFirst } from "../utils/textUtils.js";

export default function HostCard({ host, onOpen }) {
  const menuSummary =
    host.menuItems && host.menuItems.length > 0
      ? `${host.menuItems[0].name} · ${host.currency || ""} ${
          host.menuItems[0].price
        }`
      : null;

  return (
    <div className="col-12">
      <div className="sacred-card h-100 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="position-relative">
        <div className="sacred-badge">{ucFirst(host.tag)}</div>
              <img
                src={host.image}
                className="img-fluid w-100 rounded-3"
                style={{ height: "200px", objectFit: "cover" }}
                alt={host.title}
              />
            </div>
          </div>
          <div className="col-md-8">
            <div className="d-flex justify-content-between align-items-start mb-2">
            <h4 className="mb-0">{ucFirst(host.title)}</h4>
              <span className="badge bg-success bg-opacity-10 text-success">
                <i className="fa-solid fa-circle-check me-1"></i>Verified
              </span>
            </div>
            <p className="text-muted small mb-2">
              <i className="fa-solid fa-location-dot text-danger me-1"></i>{" "}
              {host.distance} | {ucFirst(host.area)}
            </p>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <span className="text-warning">
              <i className="fa-solid fa-star"></i> {ucFirst(host.rating)} ({host.reviews})
              </span>
              <span className={`badge bg-opacity-10 ${host.slotClass}`}>
                <i className="fa-solid fa-clock me-1"></i> {host.slot}
              </span>
            </div>
            <p className="text-muted small mb-3">{ucFirst(host.description)}</p>
            {menuSummary ? (
              <p className="text-muted small mb-3">
                <i className="fa-solid fa-bowl-food me-2"></i>
              {ucFirst(menuSummary)}
              </p>
            ) : null}
            <div className="d-flex justify-content-between flex-wrap gap-2">
              <button
                className="btn btn-sm btn-feast"
                type="button"
                onClick={() => onOpen?.(host.id)}
              >
                <i className="fa-solid fa-circle-info me-1"></i>View details
              </button>
              <button className="btn btn-sm btn-outline-secondary">
                <i className="fa-solid fa-phone"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
