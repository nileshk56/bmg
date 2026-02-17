const dynamo = require('../db/dynamo');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');

const TABLE = 'users';

// Create User
const createUser = async ({ firstname, lastname, email, password, gender, dob }) => {
    const hashedPwd = await bcrypt.hash(password, 10);
    const user = {
        uid: nanoid(13),
        firstname: typeof firstname === 'string' ? firstname.toLowerCase() : firstname,
        lastname: typeof lastname === 'string' ? lastname.toLowerCase() : lastname,
        email: typeof email === 'string' ? email.toLowerCase() : email,
        password: hashedPwd,
        gender: typeof gender === 'string' ? gender.toLowerCase() : gender,
        dob
    };
    console.log('Creating user:', user);
    try {
        await dynamo.put({ TableName: TABLE, Item: user }).promise();
    } catch (err) {
        throw err;
    }
    return user;
};

// Get User by Email
const getUserByEmail = async (email) => {
    const result = await dynamo.query({
        TableName: TABLE,
        IndexName: 'emailIndex',             // use the GSI
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
    }).promise();

    return result.Items[0];                 // returns the first matching user
};


// Get User by ID
const getUserByUid = async (uid) => {
    const result = await dynamo.get({ TableName: TABLE, Key: { uid } }).promise();
    return result.Item;
};

// Update User
const updateUser = async (uid, data) => {
    const updates = Object.keys(data).map((k, i) => `${k} = :v${i}`).join(', ');
    const values = Object.values(data).reduce((acc, v, i) => ({ ...acc, [`:v${i}`]: v }), {});
    await dynamo.update({
        TableName: TABLE,
        Key: { uid },
        UpdateExpression: `set ${updates}`,
        ExpressionAttributeValues: values
    }).promise();
    return await getUserByUid(uid);
};

// Delete User
const deleteUser = async (uid) => {
    await dynamo.delete({ TableName: TABLE, Key: { uid } }).promise();
    return { uid };
};

const updateUserPhoto = async (uid, photoUrl) => {
    const updates = 'profilePhotoUrl = :photoUrl';
    const values = { ':photoUrl': photoUrl };
    await dynamo.update({
        TableName: TABLE,
        Key: { uid },
        UpdateExpression: `set ${updates}`,
        ExpressionAttributeValues: values
    }).promise();
    return await getUserByUid(uid);
};

const updateUserType = async (uid, userType) => {
    const updates = 'userType = :userType';
    const values = { ':userType': userType };
    await dynamo.update({
        TableName: TABLE,
        Key: { uid },
        UpdateExpression: `set ${updates}`,
        ExpressionAttributeValues: values
    }).promise();
    return await getUserByUid(uid);
};

const searchUsersByName = async (firstName, lastNamePrefix) => {
    console.log(    'Searching users with firstName:', firstName, 'and lastNamePrefix:', lastNamePrefix);
    if (!firstName || !lastNamePrefix) {
        throw new Error("Both firstName and lastNamePrefix are required");
    }

    // normalize
    const fn = firstName.toLowerCase().trim();
    const ln = lastNamePrefix.toLowerCase().trim();

    const params = {
        TableName: TABLE,
        IndexName: 'firstname-lastname-index', // GSI with PK: firstName, SK: lastName
        KeyConditionExpression: 'firstname = :fn AND begins_with(lastname, :ln)',
        ExpressionAttributeValues: {
            ':fn': fn,
            ':ln': ln
        }
    };

    try {
        const result = await dynamo.query(params).promise(); // v2 syntax
        return result.Items || [];
    } catch (error) {
        console.error('DynamoDB query error:', error);
        throw error;
    }
};

module.exports = {
    createUser,
    getUserByEmail,
    getUserByUid,
    updateUser,
    deleteUser,
    searchUsersByName,
    updateUserPhoto,
    updateUserType
};
