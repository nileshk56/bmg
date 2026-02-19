import { useEffect, useState } from "react";
import NavBar from "../components/NavBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE } from "../config/api.js";

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    gender: user?.gender || "",
    dob: user?.dob || "",
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePhoto || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  useEffect(() => {
    if (!previewUrl?.startsWith("blob:")) return;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setForm({
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      gender: user?.gender || "",
      dob: user?.dob || "",
    });
  }, [user]);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const isValidDob = (value) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    return date <= today;
  };

  const getImageDimensions = (imageFile) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(imageFile);
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

  const handleSelect = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError("");
    setSuccess("");

    if (!selected.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    if (selected.size > 307200) {
      setError("Profile photo must be under 300KB.");
      return;
    }

    try {
      const { width, height } = await getImageDimensions(selected);
      if (width !== 250 || height !== 250) {
        setError("Profile photo must be exactly 250x250 pixels.");
        return;
      }
    } catch (err) {
      setError("Unable to read image dimensions.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "user_profile" }),
      });

      if (!presignRes.ok) {
        throw new Error("Unable to get upload URL.");
      }

      const presignData = await presignRes.json();
      const upload = presignData?.upload;
      const maxBytes = presignData?.maxBytes;
      const requiredSize = presignData?.requiredSize || "250x250";

      if (!upload?.url || !upload?.fields) {
        throw new Error("Upload URL is incomplete.");
      }

      if (maxBytes && file.size > maxBytes) {
        throw new Error(
          `Profile photo must be under ${Math.round(maxBytes / 1024)}KB.`
        );
      }

      if (requiredSize !== "250x250") {
        // Keep our strict validation for now, but surface server requirement.
        throw new Error(`Profile photo must be ${requiredSize} pixels.`);
      }

      const formData = new FormData();
      Object.entries(upload.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      const uploadRes = await fetch(upload.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Photo upload failed.");
      }

      if (presignData?.fileUrl) {
        updateUser({ profilePhoto: presignData.fileUrl });
        setPreviewUrl(presignData.fileUrl);
      }
      setFile(null);
      setSuccess("Profile photo updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setProfileSuccess("");
    setSavingProfile(true);

    try {
      if (!form.firstname.trim()) {
        throw new Error("First name is required.");
      }
      if (!form.lastname.trim()) {
        throw new Error("Last name is required.");
      }
      if (!form.gender) {
        throw new Error("Please select a gender.");
      }
      if (!isValidDob(form.dob)) {
        throw new Error("Please enter a valid birthdate.");
      }

      const userId = user?.uid || user?.userId || user?.id;
      if (!userId) {
        throw new Error("Unable to update profile without a user id.");
      }

      const payload = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        gender: form.gender,
        dob: form.dob,
        photoUrl: user?.profilePhoto || previewUrl || "",
      };
      if (user?.userType) {
        payload.userType = user.userType.toLowerCase();
      }

      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to update profile.");
      }

      updateUser({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        gender: form.gender,
        dob: form.dob,
      });
      setProfileSuccess("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div>
      <NavBar />
      <section className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <form
              className="card shadow-lg border-0 p-4 p-md-5"
              onSubmit={handleProfileSave}
            >
              <h2 className="fw-bold mb-4">
                <i className="fa-solid fa-user-pen me-2 text-feast"></i>
                Edit profile
              </h2>

              <div className="mt-4">
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

                {profileSuccess ? (
                  <div className="alert alert-success mt-3 py-2 small">
                    {profileSuccess}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="btn btn-feast mt-3"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                      Saving
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk me-2"></i>
                      Save profile
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5">
                <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                  <div className="profile-photo-preview">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" />
                    ) : (
                      <div className="profile-placeholder">
                        <i className="fa-solid fa-user"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-muted mb-2">
                      Set your profile photo (250x250px, max 300KB).
                    </p>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleSelect}
                    />
                    <button
                      type="button"
                      className="btn btn-feast mt-3"
                      onClick={handleUpload}
                      disabled={loading || !file}
                    >
                      {loading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin me-2"></i>
                          Uploading
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up me-2"></i>
                          Save profile photo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="alert alert-danger mt-4 py-2 small">{error}</div>
              ) : null}
              {success ? (
                <div className="alert alert-success mt-4 py-2 small">
                  {success}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
