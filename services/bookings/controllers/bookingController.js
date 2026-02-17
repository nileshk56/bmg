const {
  createBooking,
  listBookingsByListingDate,
  listBookingsByUserId,
  listBookingsByUserIdAndDate,
  getListingById
} = require('../services/bookingsService');
const axios = require('axios');
const config = require('../config');

const SLOT_MINUTES = 60;

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

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const isValidDate = (value) => {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const buildSlots = ({ openTime, closeTime }) => {
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) return null;

  const slots = [];
  for (let start = openMinutes; start + SLOT_MINUTES <= closeMinutes; start += SLOT_MINUTES) {
    const end = start + SLOT_MINUTES;
    slots.push({
      slotStart: minutesToTime(start),
      slotEnd: minutesToTime(end)
    });
  }

  return slots;
};

const availability = async (req, res) => {
  try {
    const { listingId, date } = req.query;

    if (!listingId) return res.status(400).json({ message: 'listingId is required' });
    if (!isValidDate(date)) return res.status(400).json({ message: 'date must be YYYY-MM-DD' });

    const listing = await getListingById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const capacity = Number(listing.slotCapacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({ message: 'Listing slotCapacity is invalid' });
    }

    const slots = buildSlots({ openTime: listing.openTime, closeTime: listing.closeTime });
    if (!slots) {
      return res.status(400).json({ message: 'openTime and closeTime must be valid HH:mm and openTime < closeTime' });
    }

    const bookings = await listBookingsByListingDate({ listingId, listingDate: date });

    const bookedBySlot = new Map();
    bookings.forEach((b) => {
      const key = `${b.slotStart}-${b.slotEnd}`;
      const current = bookedBySlot.get(key) || 0;
      bookedBySlot.set(key, current + Number(b.guestCount || 0));
    });

    const availability = slots.map((slot) => {
      const key = `${slot.slotStart}-${slot.slotEnd}`;
      const booked = bookedBySlot.get(key) || 0;
      const remaining = Math.max(0, capacity - booked);
      return {
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
        booked,
        remaining,
        isFull: remaining === 0
      };
    });

    res.json({
      listingId,
      date,
      slotCapacity: capacity,
      slots: availability
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { listingId, date, slotStart, slotEnd, guestCount } = req.body;

    if (!listingId) return res.status(400).json({ message: 'listingId is required' });
    if (!isValidDate(date)) return res.status(400).json({ message: 'date must be YYYY-MM-DD' });

    const startMinutes = parseTimeToMinutes(slotStart);
    const endMinutes = parseTimeToMinutes(slotEnd);
    if (startMinutes === null || endMinutes === null || endMinutes - startMinutes !== SLOT_MINUTES) {
      return res.status(400).json({ message: 'slotStart and slotEnd must be valid HH:mm with 60 minutes duration' });
    }

    const listing = await getListingById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const capacity = Number(listing.slotCapacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({ message: 'Listing slotCapacity is invalid' });
    }

    const slots = buildSlots({ openTime: listing.openTime, closeTime: listing.closeTime }) || [];
    const isWithinSchedule = slots.some((slot) => slot.slotStart === slotStart && slot.slotEnd === slotEnd);
    if (!isWithinSchedule) {
      return res.status(400).json({ message: 'slotStart/slotEnd must be within listing open/close time' });
    }

    const guests = Number(guestCount);
    if (!Number.isInteger(guests) || guests <= 0) {
      return res.status(400).json({ message: 'guestCount must be a positive integer' });
    }

    const bookingsResult = await listBookingsByListingDate({ listingId, date });
    const slotKey = `${slotStart}-${slotEnd}`;
    const booked = bookingsResult.items
      .filter((b) => `${b.slotStart}-${b.slotEnd}` === slotKey)
      .reduce((sum, b) => sum + Number(b.guestCount || 0), 0);

    if (booked + guests > capacity) {
      return res.status(409).json({ message: 'Slot is full or does not have enough remaining capacity' });
    }

    const userId = req.user?.uid;
    const userName = [req.user?.firstname, req.user?.lastname].filter(Boolean).join(' ').trim();

    const existingForDate = await listBookingsByUserIdAndDate({ userId, date });
    const alreadyBooked = existingForDate.some(
      (b) =>
        b.listingId === listingId &&
        b.slotStart === slotStart &&
        b.slotEnd === slotEnd
    );
    if (alreadyBooked) {
      return res.status(409).json({ message: 'User already booked this slot' });
    }

    const booking = await createBooking({
      listingId,
      listingDate: `${listingId}#${date}`,
      date,
      slotStart,
      slotEnd,
      guestCount: guests,
      userId,
      userName
    });

    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const listMyBookings = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const bookings = await listBookingsByUserId({ userId, limit: 25 });
    const listingCache = new Map();
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        if (!booking.listingId) return { ...booking, listing: null };
        if (listingCache.has(booking.listingId)) {
          return { ...booking, listing: listingCache.get(booking.listingId) };
        }
        const listing = await getListingById(booking.listingId);
        listingCache.set(booking.listingId, listing || null);
        return { ...booking, listing: listing || null };
      })
    );

    res.json({ count: enriched.length, bookings: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
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

const listBookingsForListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { limit, nextToken, date } = req.query;
    const userId = req.user?.uid;
    if (!listingId) return res.status(400).json({ message: 'listingId is required' });
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const listing = await getListingById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const ownerIdRaw = String(listing.userId || '');
    const ownerId = ownerIdRaw.includes('#') ? ownerIdRaw.split('#')[0] : ownerIdRaw;
    console.log(listingId,listing,"Listing ownerId:", ownerId, "Requesting userId:", userId);
    if (ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const pageSize = parseLimit(limit);
    const lastKey = decodeNextToken(nextToken);
    const targetDate = date && isValidDate(date) ? date : new Date().toISOString().slice(0, 10);
    const result = await listBookingsByListingDate({
      listingId,
      date: targetDate,
      limit: pageSize,
      lastKey
    });

    const token = req.headers['authorization'];
    const baseUrl = config.usersServiceUrl;
    if (!baseUrl) {
      return res.status(500).json({ message: 'USERS_SERVICE_URL is not configured' });
    }

    const enriched = await Promise.all(
      result.items.map(async (booking) => {
        try {
          const resp = await axios.get(`${baseUrl}/users/${booking.userId}`, {
            headers: token ? { Authorization: token } : undefined
          });
          const user = resp.data?.user || null;
          return {
            ...booking,
            user
          };
        } catch (err) {
          return {
            ...booking,
            user: null
          };
        }
      })
    );

    res.json({
      listingId,
      date: targetDate,
      count: enriched.length,
      bookings: enriched,
      nextToken: encodeNextToken(result.lastKey)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  availability,
  create,
  listMyBookings,
  listBookingsForListing
};
