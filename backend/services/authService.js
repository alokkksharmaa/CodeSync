import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * AuthService - Handles JWT authentication and user management
 */
class AuthService {
  constructor() {
    // In-memory user store (replace with database in production)
    this.users = new Map();
    this.JWT_SECRET = process.env.JWT_SECRET || 'codesync-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = '7d';
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Register new user
   */
  async register(email, password, username) {
    // Check if user already exists
    if (this.findUserByEmail(email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID and color
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const color = this.generateUserColor();

    const user = {
      id: userId,
      email,
      username,
      password: hashedPassword,
      color,
      createdAt: new Date().toISOString()
    };

    this.users.set(email, user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user
   */
  async login(email, password) {
    const user = this.findUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by email
   */
  findUserByEmail(email) {
    return this.users.get(email);
  }

  /**
   * Find user by ID
   */
  findUserById(userId) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  /**
   * Generate random user color
   */
  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Update user color preference
   */
  updateUserColor(userId, color) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        user.color = color;
        return true;
      }
    }
    return false;
  }
}

export default new AuthService();