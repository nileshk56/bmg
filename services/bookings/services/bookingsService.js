const dynamo = require('../db/dynamo');
const { nanoid } = require('nanoid');

const TABLE = 'bookings';
const LISTING_DATE_INDEX = 'listingDate-index';
const USER_ID_INDEX = 'userId-index';
const USER_ID_DATE_INDEX = 'userId-date-index';
const LISTING_ID_INDEX = 'listingId-index';
const LISTINGS_TABLE = 'listings';

const createBooking = async ({
  listingId,
  listingDate,
  date,
  slotStart,
  slotEnd,
  guestCount,
  userId,
  userName
}) => {
  const now = new Date().toISOString();
  const booking = {
    bookingId: nanoid(12),
    listingId,
    listingDate,
    date,
    slotStart,
    slotEnd,
    guestCount,
    userId,
    userName,
    status: 'CONFIRMED',
    createdAt: now
  };

  await dynamo.put({ TableName: TABLE, Item: booking }).promise();
  return booking;
};

const listBookingsByListingDate = async ({ listingId, date, limit, lastKey }) => {
  const listingDateKey = `${listingId}#${date}`;
  console.log("Querying bookings for listingDateKey", listingDateKey, "lastKey", lastKey, "limit", limit);
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: LISTING_DATE_INDEX,
    KeyConditionExpression: 'listingDate = :listingDate',
    ExpressionAttributeValues: { ':listingDate': listingDateKey },
    Limit: limit,
    ExclusiveStartKey: lastKey || undefined
  }).promise();

  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
};

const listBookingsByUserId = async ({ userId, limit }) => {
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: USER_ID_DATE_INDEX,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
    Limit: limit
  }).promise();

  return result.Items || [];
};

const listBookingsByUserIdAndDate = async ({ userId, date }) => {
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: USER_ID_DATE_INDEX,
    KeyConditionExpression: 'userId = :userId AND #date = :date',
    ExpressionAttributeNames: { '#date': 'date' },
    ExpressionAttributeValues: { ':userId': userId, ':date': date }
  }).promise();

  return result.Items || [];
};

const listBookingsByListingId = async ({ listingId, limit, lastKey }) => {
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: LISTING_ID_INDEX,
    KeyConditionExpression: 'listingId = :listingId',
    ExpressionAttributeValues: { ':listingId': listingId },
    Limit: limit,
    ExclusiveStartKey: lastKey || undefined
  }).promise();

  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
};

const getListingById = async (listingId) => {
  const result = await dynamo.get({ TableName: LISTINGS_TABLE, Key: { listingId } }).promise();
  return result.Item;
};

module.exports = {
  createBooking,
  listBookingsByListingDate,
  listBookingsByUserId,
  listBookingsByUserIdAndDate,
  listBookingsByListingId,
  getListingById
};
