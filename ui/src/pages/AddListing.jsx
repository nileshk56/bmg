import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AreaInput from "../components/AreaInput.jsx";
import { toApiArea } from "../utils/areaUtils.js";
import { AREAS } from "../data/areas.js";
import { CITIES } from "../data/cities.js";
import { API_BASE } from "../config/api.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function AddListing() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    openTime: "",
    closeTime: "",
    slotCapacity: "",
    area: "",
    pin: "",
  });
  const [menuItems, setMenuItems] = useState([
    { name: "", description: "", price: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const updateArea = (value) =>
    setForm((prev) => ({ ...prev, area: value }));

  const updatePin = (event) => {
    const raw = event.target.value || "";
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, pin: digitsOnly }));
  };

  const updateMenuItem = (index, field) => (event) => {
    const value = event.target.value;
    setMenuItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addMenuItem = () => {
    setMenuItems((prev) => [...prev, { name: "", description: "", price: "" }]);
  };

  const removeMenuItem = (index) => {
    setMenuItems((prev) => {
      if (prev.length === 1) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const MAX_PHOTOS = 5;
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  const MIN_DIMENSION = 400;
  const MAX_DIMENSION = 5000;

  const getImageDimensions = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read image"));
      };
      img.src = url;
    });

  const validateImage = async (file) => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return "Image size must be under 5MB.";
    }
    const { width, height } = await getImageDimensions(file);
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      return "Image must be at least 400x400px.";
    }
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return "Image must be under 5000x5000px.";
    }
    return "";
  };

  const handlePhotoSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setPhotoError("");
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setPhotoError("Only 5 photos are allowed.");
      return;
    }

    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      setPhotoError("Only 5 photos are allowed. Extra files were skipped.");
    }

    const next = [];
    for (const file of selected) {
      try {
        const validationError = await validateImage(file);
        if (validationError) {
          setPhotoError(validationError);
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        next.push({ file, previewUrl, name: file.name });
      } catch (err) {
        setPhotoError("One of the images could not be processed.");
      }
    }

    if (next.length > 0) {
      setPhotos((prev) => [...prev, ...next]);
    }

    event.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1);
      if (removed[0]?.previewUrl) {
        URL.revokeObjectURL(removed[0].previewUrl);
      }
      return copy;
    });
  };

  const uploadPhotosToS3 = async () => {
    if (photos.length === 0) return [];
    const uploadedUrls = [];
    for (const item of photos) {
      const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "listing_photo" }),
      });

      if (!presignRes.ok) {
        throw new Error("Unable to get upload URL.");
      }

      const presignData = await presignRes.json();
      const upload = presignData?.upload;
      const maxBytes = presignData?.maxBytes;

      if (!upload?.url || !upload?.fields) {
        throw new Error("Upload URL is incomplete.");
      }

      if (maxBytes && item.file.size > maxBytes) {
        throw new Error(`Image exceeds max size of ${Math.round(maxBytes / 1024)}KB.`);
      }

      const formData = new FormData();
      Object.entries(upload.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", item.file);

      const uploadRes = await fetch(upload.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Photo upload failed.");
      }

      if (presignData?.fileUrl) {
        uploadedUrls.push(presignData.fileUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!form.title.trim()) {
        throw new Error("Restaurant name is required.");
      }
      if (!form.address.trim()) {
        throw new Error("Address is required.");
      }
      if (!form.city.trim()) {
        throw new Error("City is required.");
      }
      if (!form.openTime) {
        throw new Error("Open time is required.");
      }
      if (!form.closeTime) {
        throw new Error("Close time is required.");
      }
      if (form.openTime && form.closeTime && form.openTime >= form.closeTime) {
        throw new Error("Close time must be later than open time.");
      }
      if (!form.slotCapacity) {
        throw new Error("Slot capacity is required.");
      }
      if (Number(form.slotCapacity) < 1) {
        throw new Error("Slot capacity must be at least 1.");
      }
      if (!form.area.trim()) {
        throw new Error("Area is required.");
      }
      const normalizedPin = form.pin.trim();
      if (normalizedPin && !/^\d{6}$/.test(normalizedPin)) {
        throw new Error("PIN must be exactly 6 digits.");
      }
      if (menuItems.filter((item) => item.name && item.price).length === 0) {
        throw new Error("Add at least one menu item with name and price.");
      }
      if (photos.length === 0) {
        throw new Error("Please upload at least one photo.");
      }

      const uploadedUrls = await uploadPhotosToS3();
      if (uploadedUrls.length === 0) {
        throw new Error("Photo upload failed. Please try again.");
      }
      const payload = {
        title: form.title,
        description: form.description || "",
        address: form.address,
        city: form.city,
        menuItems: menuItems
          .filter((item) => item.name && item.price)
          .map((item) => ({
            name: item.name,
            description: item.description || "",
            price: Number(item.price),
          })),
        openTime: form.openTime,
        closeTime: form.closeTime,
        slotCapacity: Number(form.slotCapacity),
        photos: uploadedUrls,
        area: toApiArea(form.area),
        pin: normalizedPin || "",
      };

      const response = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Listing creation failed. Please check inputs.");
      }

      setSuccess(
        "Your listing is under review. It can take up to two weeks to review it. You will be notified in the queue."
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

      <section className="listing-hero py-5">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h1 className="display-6 fw-bold mb-3">
                Add a restaurant-style home listing
              </h1>
              <p className="text-muted mb-4">
                Share your menu, set your time window, and start accepting
                bookings from nearby guests.
              </p>
              <div className="d-flex flex-wrap gap-3 text-muted small">
                <span>
                  <i className="fa-solid fa-camera-retro me-2"></i>Photos & menu
                </span>
                <span>
                  <i className="fa-solid fa-clock me-2"></i>Open & close time
                </span>
                <span>
                  <i className="fa-solid fa-users me-2"></i>Slot capacity
                </span>
              </div>
            </div>
            <div className="col-lg-6 text-center text-lg-end">
              <div className="listing-hero-card d-inline-block">
                <i className="fa-solid fa-utensils"></i>
                <span>House of Feast Host Console</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg border-0 p-4 p-md-5">
              <h2 className="fw-bold mb-4">
                <i className="fa-solid fa-pen-to-square me-2 text-feast"></i>
                Listing details
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label">Restaurant name</label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={update("title")}
                      placeholder="e.g. Nilesh's Biryani House"
                      maxLength={80}
                      minLength={2}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <AreaInput
                      value={form.city}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, city: value }))
                      }
                      placeholder="Start typing your city..."
                      inputClassName="form-control"
                      options={CITIES}
                      required
                      name="city"
                      id="city"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <input
                      className="form-control"
                      value={form.address}
                      onChange={update("address")}
                      placeholder="e.g. 12, 2nd Cross, HSR Layout"
                      maxLength={140}
                      minLength={5}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.description}
                      onChange={update("description")}
                      placeholder="Tell guests about your cuisine, vibe, and specialties"
                      maxLength={500}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Open Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.openTime}
                      onChange={update("openTime")}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Close Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.closeTime}
                      onChange={update("closeTime")}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Slot Capacity</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      step="1"
                      value={form.slotCapacity}
                      onChange={update("slotCapacity")}
                      placeholder="e.g. 10"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Area</label>
                    <AreaInput
                      value={form.area}
                      onChange={updateArea}
                      placeholder="Start typing your area..."
                      inputClassName="form-control"
                      options={AREAS}
                      required
                      name="area"
                      id="area"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">PIN</label>
                    <input
                      className="form-control"
                      value={form.pin}
                      onChange={updatePin}
                      placeholder="e.g. 400067"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="fw-semibold mb-3">
                    <i className="fa-solid fa-clipboard-list me-2 text-feast"></i>
                    Menu items
                  </h4>
                  {menuItems.map((item, index) => (
                    <div className="row g-3 align-items-end mb-3" key={index}>
                    <div className="col-md-4">
                      <label className="form-label">Item name</label>
                      <input
                        className="form-control"
                        value={item.name}
                        onChange={updateMenuItem(index, "name")}
                        placeholder="e.g. Chicken Biryani"
                        maxLength={80}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        value={item.price}
                        onChange={updateMenuItem(index, "price")}
                        placeholder="e.g. 350"
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Item description</label>
                      <input
                        className="form-control"
                        value={item.description}
                        onChange={updateMenuItem(index, "description")}
                        placeholder="Optional: spice level, ingredients, or portion size"
                        maxLength={200}
                      />
                    </div>
                      <div className="col-md-1 d-flex">
                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100"
                          onClick={() => removeMenuItem(index)}
                          disabled={menuItems.length === 1}
                        >
                          <i className="fa-solid fa-minus"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={addMenuItem}
                  >
                    <i className="fa-solid fa-plus me-2"></i>
                    Add another item
                  </button>
                </div>

                {error ? (
                  <div className="alert alert-danger mt-4 py-2 small">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="alert alert-success mt-4 small">
                    <div className="fw-semibold mb-1">
                      <i className="fa-solid fa-circle-check me-2"></i>Listing
                      submitted
                    </div>
                    <div className="mb-2">{success}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => navigate("/home")}
                    >
                      Go to home
                    </button>
                  </div>
                ) : null}

                <div className="mt-4">
                  <h4 className="fw-semibold mb-3">
                    <i className="fa-solid fa-camera me-2 text-feast"></i>
                    Upload photos (max 5)
                  </h4>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                  />
                  <div className="small text-muted mt-2">
                    Images must be under 5MB, between 400x400px and 5000x5000px.
                  </div>
                  {photoError ? (
                    <div className="alert alert-warning mt-3 py-2 small">
                      {photoError}
                    </div>
                  ) : null}
                  {photos.length > 0 ? (
                    <div className="row g-3 mt-2">
                      {photos.map((photo, index) => (
                        <div className="col-6 col-md-4" key={photo.previewUrl}>
                          <div className="photo-preview">
                            <img
                              src={photo.previewUrl}
                              alt={photo.name}
                              className="img-fluid"
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-light photo-remove"
                              onClick={() => removePhoto(index)}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="d-flex flex-column flex-md-row gap-3 mt-4">
                  <button
                    type="submit"
                    className="btn btn-feast px-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        Saving
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up me-2"></i>
                        Publish listing
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => navigate("/home")}
                  >
                    <i className="fa-solid fa-arrow-left me-2"></i>
                    Back to home
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
