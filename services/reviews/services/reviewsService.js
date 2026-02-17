const dynamo = require('../db/dynamo');
const { nanoid } = require('nanoid');

const TABLE = 'reviews';
const LISTINGS_TABLE = 'listings';

const createReview = async ({
  listingId,
  bookingId,
  rating,
  comment,
  userId,
  userName
}) => {
  const now = new Date().toISOString();
  const review = {
    listingId,
    userId,
    reviewId: nanoid(12),
    bookingId: bookingId || null,
    rating,
    comment: comment || '',
    userName,
    createdAt: now
  };

  await dynamo.put({
    TableName: TABLE,
    Item: review,
    ConditionExpression: 'attribute_not_exists(listingId) AND attribute_not_exists(userId)'
  }).promise();
  return review;
};

const listReviewsByListing = async ({ listingId, limit, lastKey }) => {
  const result = await dynamo.query({
    TableName: TABLE,
    KeyConditionExpression: 'listingId = :listingId',
    ExpressionAttributeValues: { ':listingId': listingId },
    Limit: limit,
    ExclusiveStartKey: lastKey || undefined
  }).promise();

  return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
};

const updateListingRating = async ({ listingId, rating }) => {
  const addResult = await dynamo.update({
    TableName: LISTINGS_TABLE,
    Key: { listingId },
    UpdateExpression: 'ADD ratingCount :one, ratingSum :rating',
    ExpressionAttributeValues: {
      ':one': 1,
      ':rating': rating
    },
    ReturnValues: 'UPDATED_NEW'
  }).promise();

  const ratingCount = Number(addResult.Attributes?.ratingCount || 0);
  const ratingSum = Number(addResult.Attributes?.ratingSum || 0);
  const averageRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

  await dynamo.update({
    TableName: LISTINGS_TABLE,
    Key: { listingId },
    UpdateExpression: 'SET averageRating = :avg',
    ExpressionAttributeValues: { ':avg': averageRating }
  }).promise();

  return { ratingCount, ratingSum, averageRating };
};

const getListingRating = async ({ listingId }) => {
  const result = await dynamo.get({
    TableName: LISTINGS_TABLE,
    Key: { listingId },
    ProjectionExpression: 'ratingCount, ratingSum, averageRating'
  }).promise();
  return result.Item || null;
};

module.exports = {
  createReview,
  listReviewsByListing,
  updateListingRating,
  getListingRating
};
