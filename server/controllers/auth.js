const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const StreamChat = require('stream-chat').StreamChat;
const crypto = require('crypto');

require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const signup = async (req, res) => {
    console.log("Hi");
    try {
        const { fullName, username, password, phoneNumber } = req.body;

        // Generate a random userId
        const userId = crypto.randomBytes(16).toString('hex');

        // Connect to Stream Chat using credentials from environment variables
        const serverClient = connect(api_key, api_secret, app_id);

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a Stream Chat user token for the newly registered user
        const token = serverClient.createUserToken(userId);

        // Return user data including token, userId, hashedPassword (for debugging), and other details
        res.status(200).json({ token, fullName, username, userId, hashedPassword, phoneNumber });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};


const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Connect to Stream Chat using credentials from environment variables
        const serverClient = connect(api_key, api_secret, app_id);
        const client = StreamChat.getInstance(api_key, api_secret);

        // Query Stream Chat for users with the provided username
        const { users } = await client.queryUsers({ name: username });

        // If no user found, return a 400 error
        if (!users.length) return res.status(400).json({ message: 'User not found' });

        // Compare the provided password with the hashed password stored in Stream Chat
        const success = await bcrypt.compare(password, users[0].hashedPassword);

        // Create a Stream Chat user token for the authenticated user
        const token = serverClient.createUserToken(users[0].id);

        // If passwords match, return user data including token, username, and userId
        if (success) {
            res.status(200).json({ token, fullName: users[0].fullName, username, userId: users[0].id });
        } else {
            res.status(500).json({ message: 'Incorrect password' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};


module.exports = { signup, login }
