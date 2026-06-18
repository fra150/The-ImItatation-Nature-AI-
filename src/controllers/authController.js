const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const environment = require('../config/environment');
const logger = require('../utils/logger');

/**
 * Registra un nuovo utente. La validazione dell'input è applicata come
 * middleware nelle route (vedi authRoutes), quindi qui i dati sono già validi.
 */
const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'user',
    });

    return res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    logger.error(`Error registering user: ${error.message}`);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Autentica un utente e restituisce un JWT con scadenza 8h.
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, environment.jwtSecret, {
      expiresIn: '8h',
    });

    return res.json({ token });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    return res.status(500).json({ error: 'Failed to login user' });
  }
};

/**
 * Logout. Con JWT stateless il server non mantiene sessioni: il client deve
 * scartare il token. Per un'invalidazione reale servirebbe una blocklist dei
 * token (es. Redis) — vedi TODO nel README.
 */
const logout = (_req, res) => {
  return res.status(200).json({ message: 'Logout successful. Please discard your token client-side.' });
};

module.exports = {
  register,
  login,
  logout,
};
