const dynamo = require('../db/dynamo');
const { nanoid, customAlphabet } = require('nanoid');

const TABLE = 'listings';
const USER_ID_INDEX = 'userId-index';
const CODE_INDEX = 'code-index';
const AREA_KEY_INDEX = 'area-index';
const PIN_INDEX = 'pin-index';

const createListingCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const createListing = async ({
  userId,
  userName,
  title,
  description,
  address,
  menuItems,
  openTime,
  closeTime,
  slotDurationMinutes,
  slotCapacity,
  photos,
  area,
  pin,
  city
}) => {
  const now = new Date().toISOString();
  const listing = {
    listingId: nanoid(12),
    code: createListingCode(),
    userId,
    userName,
    title,
    description: description || '',
    address: address || '',
    menuItems,
    openTime,
    closeTime,
    slotDurationMinutes,
    slotCapacity,
    photos,
    area,
    pin,
    city,
    createdAt: now,
    updatedAt: now,
    status: 'PENDING'
  };

  await dynamo.put({ TableName: TABLE, Item: listing }).promise();
  return listing;
};

const getListingById = async (listingId) => {
  const result = await dynamo.get({ TableName: TABLE, Key: { listingId } }).promise();
  return result.Item;
};

const listListings = async ({ userId }) => {
  if (userId) {
    const result = await dynamo.query({
      TableName: TABLE,
      IndexName: USER_ID_INDEX,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }).promise();
    return result.Items || [];
  }

  const result = await dynamo.scan({ TableName: TABLE }).promise();
  return result.Items || [];
};

const getListingByCode = async (code) => {
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: CODE_INDEX,
    KeyConditionExpression: 'code = :code',
    ExpressionAttributeValues: { ':code': code }
  }).promise();

  return result.Items[0];
};

const listListingsByArea = async ({ area, limit, lastKey, status }) => {
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: AREA_KEY_INDEX,
    KeyConditionExpression: 'area = :area',
    FilterExpression: status ? '#status = :status' : undefined,
    ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: status
      ? { ':area': area, ':status': status }
      : { ':area': area },
    Limit: limit,
    ExclusiveStartKey: lastKey || undefined
  }).promise();

  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
};

const listListingsByPin = async ({ pin, limit, lastKey, status }) => {
  const result = await dynamo.query({
    TableName: TABLE,
    IndexName: PIN_INDEX,
    KeyConditionExpression: 'pin = :pin',
    FilterExpression: status ? '#status = :status' : undefined,
    ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: status
      ? { ':pin': pin, ':status': status }
      : { ':pin': pin },
    Limit: limit,
    ExclusiveStartKey: lastKey || undefined
  }).promise();

  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
};

const updateListing = async (listingId, data) => {
  const now = new Date().toISOString();
  const updates = [];
  const values = {};

  Object.entries(data).forEach(([key, value]) => {
    updates.push(`${key} = :${key}`);
    values[`:${key}`] = value;
  });

  updates.push('updatedAt = :updatedAt');
  values[':updatedAt'] = now;

  await dynamo.update({
    TableName: TABLE,
    Key: { listingId },
    UpdateExpression: `set ${updates.join(', ')}`,
    ExpressionAttributeValues: values
  }).promise();

  return getListingById(listingId);
};

const deleteListing = async (listingId) => {
  await dynamo.delete({ TableName: TABLE, Key: { listingId } }).promise();
  return { listingId };
};

module.exports = {
  createListing,
  getListingById,
  listListings,
  getListingByCode,
  listListingsByArea,
  listListingsByPin,
  updateListing,
  deleteListing
};
