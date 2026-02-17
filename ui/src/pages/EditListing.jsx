import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AreaInput from "../components/AreaInput.jsx";
import { toApiArea } from "../utils/areaUtils.js";
import { API_BASE } from "../config/api.js";

const FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI0YjM2NzBiYy05MGU1LTQ1YTUtYjYwMC03NmMyYzI3Y2ZkYjIiLCJlbWFpbCI6Im5pbGVzaDFAZXhhbXBsZS5jb20iLCJmaXJzdG5hbWUiOiJuaWxlc2giLCJsYXN0bmFtZSI6ImthbiIsImdlbmRlciI6Im1hbGUiLCJpYXQiOjE3NzA1MzI2NjQsImV4cCI6MTc3MDUzNjI2NH0.gNptWizPrkVlxkryH8nO_B_ymPbEAZ_zySdnjRSRJDs";

export default function EditListing() {
  const { listingId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    openTime: "",
    closeTime: "",
    slotCapacity: "",
    area: "",
    pin: "",
  });
  const [menuItems, setMenuItems] = useState([
    { name: "", description: "", price: "" },
  ]);
  const [photos, setPhotos] = useState([]);
  const [removedPhotos, setRemovedPhotos] = useState(new Set());
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const updateArea = (value) =>
    setForm((prev) => ({ ...prev, area: value }));

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
    const remaining = MAX_PHOTOS - (photos.length - removedPhotos.size) - newPhotos.length;
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
      setNewPhotos((prev) => [...prev, ...next]);
    }

    event.target.value = "";
  };

  const toggleRemoveExistingPhoto = (photoUrl) => {
    setRemovedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoUrl)) {
        next.delete(photoUrl);
      } else {
        next.add(photoUrl);
      }
      return next;
    });
  };

  const removeNewPhoto = (index) => {
    setNewPhotos((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1);
      if (removed[0]?.previewUrl) {
        URL.revokeObjectURL(removed[0].previewUrl);
      }
      return copy;
    });
  };

  const uploadNewPhotos = async () => {
    if (newPhotos.length === 0) return [];
    const uploadedUrls = [];
    for (const item of newPhotos) {
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
        throw new Error(
          `Image exceeds max size of ${Math.round(maxBytes / 1024)}KB.`
        );
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

  useEffect(() => {
    let active = true;
    const fetchListing = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
        `${API_BASE}/listings/${listingId}`,
          {
            headers: {
              Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load listing.");
        }

        const data = await response.json();
        if (!active) return;
        const listing = data.listing;
        setForm({
          title: listing.title || "",
          description: listing.description || "",
          address: listing.address || listing.location || "",
          openTime: listing.openTime || "",
          closeTime: listing.closeTime || "",
          slotCapacity: listing.slotCapacity || "",
          area: listing.area || "",
          pin: listing.pin || "",
        });
        setMenuItems(
          listing.menuItems?.length
            ? listing.menuItems.map((item) => ({
                name: item.name || "",
                description: item.description || "",
                price: item.price ?? "",
              }))
            : [{ name: "", description: "", price: "" }]
        );
        setPhotos(listing.photos || []);
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
  }, [listingId, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (!form.title.trim()) {
        throw new Error("Restaurant name is required.");
      }
      if (!form.address.trim()) {
        throw new Error("Address is required.");
      }
      if (!form.openTime) {
        throw new Error("Open time is required.");
      }
      if (!form.closeTime) {
        throw new Error("Close time is required.");
      }
      if (!form.slotCapacity) {
        throw new Error("Slot capacity is required.");
      }
      if (!form.area.trim()) {
        throw new Error("Area is required.");
      }

      const validMenuItems = menuItems.filter((item) => item.name && item.price);
      if (validMenuItems.length === 0) {
        throw new Error("Add at least one menu item with name and price.");
      }

      const existingPhotos = photos.filter((url) => !removedPhotos.has(url));
      const uploadedUrls = await uploadNewPhotos();
      const mergedPhotos = [...existingPhotos, ...uploadedUrls];
      if (mergedPhotos.length === 0) {
        throw new Error("Please keep at least one photo.");
      }

      const payload = {
        title: form.title,
        description: form.description || "",
        address: form.address,
        openTime: form.openTime,
        closeTime: form.closeTime,
        slotCapacity: Number(form.slotCapacity),
        menuItems: validMenuItems.map((item) => ({
          name: item.name,
          description: item.description || "",
          price: Number(item.price),
        })),
        photos: mergedPhotos,
        area: toApiArea(form.area),
        pin: form.pin || "",
      };

      const response = await fetch(
        `${API_BASE}/listings/${listingId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token || FALLBACK_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update listing.");
      }

      setSuccess("Listing updated successfully.");
      setRemovedPhotos(new Set());
      setNewPhotos([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <NavBar />
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="fa-solid fa-pen-to-square text-feast me-2"></i>
            Edit listing
          </h2>
          <Link className="btn btn-outline-secondary" to="/my-listing">
            <i className="fa-solid fa-arrow-left me-2"></i>
            Back to my listing
          </Link>
        </div>

        {loading ? (
          <div className="alert alert-light text-center">
            <i className="fa-solid fa-spinner fa-spin me-2"></i>
            Loading listing...
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : null}

        {!loading ? (
          <div className="card shadow-lg border-0 p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label">Restaurant name</label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={update("title")}
                    placeholder="e.g. Nilesh's Biryani House"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    value={form.address}
                    onChange={update("address")}
                    placeholder="e.g. 12, 2nd Cross, HSR Layout"
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
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">PIN</label>
                  <input
                    className="form-control"
                    value={form.pin}
                    onChange={update("pin")}
                    placeholder="e.g. 400067"
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

              <div className="mt-4">
                <h4 className="fw-semibold mb-3">
                  <i className="fa-solid fa-camera me-2 text-feast"></i>
                  Photos (max 5)
                </h4>
                {photos.length > 0 ? (
                  <div className="row g-3 mb-3">
                    {photos.map((photoUrl) => (
                      <div className="col-6 col-md-4" key={photoUrl}>
                        <div className="photo-preview">
                          <img src={photoUrl} alt="Listing" />
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              removedPhotos.has(photoUrl)
                                ? "btn-danger"
                                : "btn-light"
                            } photo-remove`}
                            onClick={() => toggleRemoveExistingPhoto(photoUrl)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
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
                {newPhotos.length > 0 ? (
                  <div className="row g-3 mt-2">
                    {newPhotos.map((photo, index) => (
                      <div className="col-6 col-md-4" key={photo.previewUrl}>
                        <div className="photo-preview">
                          <img src={photo.previewUrl} alt={photo.name} />
                          <button
                            type="button"
                            className="btn btn-sm btn-light photo-remove"
                            onClick={() => removeNewPhoto(index)}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {success ? (
                <div className="alert alert-success mt-4 py-2 small">
                  {success}
                </div>
              ) : null}

              <div className="d-flex flex-column flex-md-row gap-3 mt-4">
                <button
                  type="submit"
                  className="btn btn-feast px-4"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                      Saving
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk me-2"></i>
                      Save changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={() => navigate("/my-listing")}
                >
                  <i className="fa-solid fa-arrow-left me-2"></i>
                  Back to my listing
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}
