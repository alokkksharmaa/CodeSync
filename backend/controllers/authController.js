const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a short, shareable room ID (e.g. "a3f2-9c1d")
 */
const generateRoomId = () => {
  const id = uuidv4().replace(/-/g, '').substring(0, 8);
  return id.match(/.{1,4}/g).join('-');
};

/**
 * Generate a signed JWT token with user id and username embedded.
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ─── POST /api/auth/signup ──────────────────────────────────────────────────

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check for duplicate username or email
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await User.create({ username, email, password: undefined, passwordHash });

    // Sign JWT
    const token = signToken(user);

    // Generate a room ID for immediate use
    const roomId = generateRoomId();

    return res.status(201).json({
      token,
      roomId,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[signup error]', error);
    return res.status(500).json({ message: 'Server error during signup.' });
  }
};

// ─── POST /api/auth/login ───────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email (select passwordHash explicitly since toJSON strips it)
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = signToken(user);

    // Generate a fresh room ID on every login
    const roomId = generateRoomId();

    return res.status(200).json({
      token,
      roomId,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[login error]', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = { signup, login };
