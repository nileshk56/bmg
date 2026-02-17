const {
  createListing,
  getListingById,
  listListings,
  getListingByCode,
  listListingsByArea,
  listListingsByPin,
  updateListing,
  deleteListing
} = require('../services/listingsService');
const axios = require('axios');
const config = require('../config');

const normalizeMenuItems = (menuItems) => {
  if (!Array.isArray(menuItems) || menuItems.length === 0) return null;

  const normalized = [];
  for (const item of menuItems) {
    if (!item || typeof item.name !== 'string' || item.name.trim() === '') return null;
    const price = Number(item.price);
    if (!Number.isFinite(price) || price <= 0) return null;

    normalized.push({
      name: item.name.trim().toLowerCase(),
      description: typeof item.description === 'string' ? item.description.trim().toLowerCase() : '',
      price
    });
  }

  return normalized;
};

const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const normalizePhotos = (photos) => {
  if (photos === undefined) return [];
  if (!Array.isArray(photos)) return null;
  if (photos.length > 5) return null;
  const cleaned = photos
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
  if (cleaned.length !== photos.length) return null;
  return cleaned;
};

const normalizeAreaKey = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const parseLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  const limit = Math.floor(parsed);
  if (limit <= 0) return 20;
  return Math.min(limit, 100);
};

const decodeNextToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
};

const encodeNextToken = (lastKey) => {
  if (!lastKey) return null;
  return Buffer.from(JSON.stringify(lastKey), 'utf8').toString('base64');
};

const create = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      menuItems,
      openTime,
      closeTime,
      slotCapacity,
      photos,
      area,
      pin,
      city
    } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'title is required' });
    }

    const normalizedMenuItems = normalizeMenuItems(menuItems);
    if (!normalizedMenuItems) {
      return res.status(400).json({ message: 'menuItems must include name and price' });
    }

    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);
    if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
      return res.status(400).json({ message: 'openTime and closeTime must be valid HH:mm and openTime < closeTime' });
    }

    const capacity = Number(slotCapacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({ message: 'slotCapacity must be a positive integer' });
    }

    const normalizedPhotos = normalizePhotos(photos);
    if (normalizedPhotos === null) {
      return res.status(400).json({ message: 'photos must be an array of up to 5 S3 URLs' });
    }

    if (!area || typeof area !== 'string') {
      return res.status(400).json({ message: 'area is required' });
    }

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ message: 'pin is required' });
    }

    if (!city || typeof city !== 'string') {
      return res.status(400).json({ message: 'city is required' });
    }

    const normalizedArea = normalizeAreaKey(area);
    if (!normalizedArea) {
      return res.status(400).json({ message: 'area is required' });
    }

    const userId = req.user?.uid;
    const userName = [req.user?.firstname, req.user?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim()
      .toLowerCase();

    const listing = await createListing({
      userId,
      userName,
      title: title.trim().toLowerCase(),
      description: typeof description === 'string' ? description.trim().toLowerCase() : '',
      address: typeof address === 'string' ? address.trim().toLowerCase() : '',
      menuItems: normalizedMenuItems,
      openTime,
      closeTime,
      slotDurationMinutes: 60,
      slotCapacity: capacity,
      photos: normalizedPhotos,
      area: normalizedArea,
      pin: String(pin).trim(),
      city: city.trim().toLowerCase()
    });

    const baseUrl = config.usersServiceUrl;
    if (baseUrl) {
      const token = req.headers['authorization'];
      await axios.put(
        `${baseUrl}/users/type`,
        { userType: 'HOST' },
        { headers: token ? { Authorization: token } : undefined }
      );
    }

    res.json({ listingId: listing.listingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await getListingById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const list = async (req, res) => {
  try {
    const { userId } = req.query;
    const listings = await listListings({ userId });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listMy = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const listings = await listListings({ userId });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getListingPhotoUploadUrl = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const baseUrl = config.uploadsServiceUrl;
    if (!baseUrl) {
      return res.status(500).json({ message: 'UPLOADS_SERVICE_URL is not configured' });
    }

    const token = req.headers['authorization'];
    const resp = await axios.post(
      `${baseUrl}/uploads/presign`,
      { type: 'listing_photo' },
      { headers: token ? { Authorization: token } : undefined }
    );

    res.json(resp.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getListingById(id);
    if (!existing) return res.status(404).json({ message: 'Listing not found' });

    if (existing.userId !== req.user?.uid) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowed = [
      'title',
      'description',
      'address',
      'menuItems',
      'status',
      'openTime',
      'closeTime',
      'slotCapacity',
      'photos',
      'area',
      'pin',
      'city'
    ];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.title && typeof updates.title === 'string') {
      updates.title = updates.title.trim();
    }

    if (updates.menuItems !== undefined) {
      const normalizedMenuItems = normalizeMenuItems(updates.menuItems);
      if (!normalizedMenuItems) {
        return res.status(400).json({ message: 'menuItems must include name and price' });
      }
      updates.menuItems = normalizedMenuItems;
    }

    if (updates.openTime !== undefined || updates.closeTime !== undefined) {
      const openMinutes = parseTimeToMinutes(updates.openTime ?? existing.openTime);
      const closeMinutes = parseTimeToMinutes(updates.closeTime ?? existing.closeTime);
      if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
        return res.status(400).json({ message: 'openTime and closeTime must be valid HH:mm and openTime < closeTime' });
      }
    }

    if (updates.slotCapacity !== undefined) {
      const capacity = Number(updates.slotCapacity);
      if (!Number.isInteger(capacity) || capacity <= 0) {
        return res.status(400).json({ message: 'slotCapacity must be a positive integer' });
      }
      updates.slotCapacity = capacity;
    }

    if (updates.photos !== undefined) {
      const normalizedPhotos = normalizePhotos(updates.photos);
      if (normalizedPhotos === null) {
        return res.status(400).json({ message: 'photos must be an array of up to 5 S3 URLs' });
      }
      updates.photos = normalizedPhotos;
    }

    if (updates.area !== undefined) {
      const normalizedArea = normalizeAreaKey(updates.area);
      if (!normalizedArea) {
        return res.status(400).json({ message: 'area must be a non-empty string' });
      }
      updates.area = normalizedArea;
    }

    if (updates.pin !== undefined) {
      if (!String(updates.pin).trim()) {
        return res.status(400).json({ message: 'pin must be a non-empty string' });
      }
      updates.pin = String(updates.pin).trim();
    }

    if (updates.city !== undefined) {
      if (!String(updates.city).trim()) {
        return res.status(400).json({ message: 'city must be a non-empty string' });
      }
      updates.city = String(updates.city).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const listing = await updateListing(id, updates);
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getListingById(id);
    if (!existing) return res.status(404).json({ message: 'Listing not found' });

    if (existing.userId !== req.user?.uid) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await deleteListing(id);
    res.json({ deleted: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const search = async (req, res) => {
  try {
    const { code, area, pin, limit, nextToken } = req.query;

    if (code) {
      const listing = await getListingByCode(String(code).trim().toUpperCase());
      if (!listing || listing.status !== 'APPROVED') {
        return res.status(404).json({ message: 'Listing not found' });
      }
      return res.json({ listing });
    }

    if (area) {
      const normalizedArea = normalizeAreaKey(area);
      if (!normalizedArea) {
        return res.status(400).json({ message: 'area must be a non-empty string' });
      }
      const pageSize = parseLimit(limit);
      const lastKey = decodeNextToken(nextToken);
      const result = await listListingsByArea({ area: normalizedArea, limit: pageSize, lastKey, status: 'APPROVED' });
      return res.json({
        count: result.items.length,
        listings: result.items,
        nextToken: encodeNextToken(result.lastKey)
      });
    }

    if (pin) {
      const pinValue = String(pin).trim();
      if (!pinValue) {
        return res.status(400).json({ message: 'pin must be a non-empty string' });
      }
      const pageSize = parseLimit(limit);
      const lastKey = decodeNextToken(nextToken);
      const result = await listListingsByPin({ pin: pinValue, limit: pageSize, lastKey, status: 'APPROVED' });
      return res.json({
        count: result.items.length,
        listings: result.items,
        nextToken: encodeNextToken(result.lastKey)
      });
    }

    return res.status(400).json({ message: 'Provide code, area, or pin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  create,
  getById,
  list,
  listMy,
  getListingPhotoUploadUrl,
  search,
  update,
  remove
};
