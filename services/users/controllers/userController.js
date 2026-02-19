const { createUser, getUserByEmail, searchUsersByName, getUserByUid, updateUser } = require('../services/usersService');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');
const config = require('../config');
const axios = require('axios');

const register = async (req, res) => {
    try {
        const { firstname, lastname, email, password, gender, dob } = req.body;
        const existing = await getUserByEmail(email);
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const user = await createUser({ firstname, lastname, email, password, gender, dob });
        res.json({ uid: user.uid, email: user.email });
    } catch (err) {
        console.log("err", err)
        res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getUserByEmail(email);
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        const token = signToken(user);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { firstName, lastName } = req.query;

        if (!firstName || !lastName) {
            return res.status(400).json({ message: "firstName and lastName are required" });
        }

        const users = await searchUsersByName(firstName, lastName);
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Search failed" });
    }
}

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await getUserByUid(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProfilePhotoUploadUrl = async (req, res) => {
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
            { type: 'user_profile' },
            { headers: token ? { Authorization: token } : undefined }
        );

        res.json(resp.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

const editUser = async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!id || id !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const allowed = ['firstname', 'lastname', 'gender', 'dob', 'photoUrl', 'userType'];
        const updates = {};

        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (updates.firstname !== undefined && typeof updates.firstname !== 'string') {
            return res.status(400).json({ message: 'firstname must be a string' });
        }
        if (updates.lastname !== undefined && typeof updates.lastname !== 'string') {
            return res.status(400).json({ message: 'lastname must be a string' });
        }
        if (updates.gender !== undefined && typeof updates.gender !== 'string') {
            return res.status(400).json({ message: 'gender must be a string' });
        }
        if (updates.dob !== undefined && typeof updates.dob !== 'string') {
            return res.status(400).json({ message: 'dob must be a string' });
        }
        if (updates.photoUrl !== undefined && typeof updates.photoUrl !== 'string') {
            return res.status(400).json({ message: 'photoUrl must be a string' });
        }
        if (updates.userType !== undefined && typeof updates.userType !== 'string') {
            return res.status(400).json({ message: 'userType must be a string' });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updated = await updateUser(userId, updates);
        res.json({ user: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    register,
    login,
    searchUsers,
    getUserById,
    getProfilePhotoUploadUrl,
    editUser
};
