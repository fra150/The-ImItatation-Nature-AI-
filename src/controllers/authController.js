const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const environment = require('../config/environment');
const logger = require('../utils/logger');

// Access token: breve (stateless, non revocabile finché non scade). Refresh
// token: lungo ma REVOCABILE (riga a DB) — è lui il vero meccanismo di sessione;
// vedi models/refreshToken.js per il perché si salva solo l'hash.
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

function signAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, environment.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

async function issueRefreshToken(userId) {
  const raw = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ tokenHash: hashToken(raw), userId, expiresAt });
  return raw;
}

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
      role: role || 'viewer',
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
 * Autentica un utente: JWT di accesso a vita breve + refresh token
 * (revocabile) per rinnovarlo senza richiedere di nuovo la password.
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);

    return res.json({ token, refreshToken, expiresIn: ACCESS_TOKEN_TTL });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    return res.status(500).json({ error: 'Failed to login user' });
  }
};

/**
 * Scambia un refresh token valido (non scaduto, non revocato) con una nuova
 * coppia access+refresh. Il refresh token usato viene REVOCATO (rotazione):
 * ogni refresh token è utilizzabile una sola volta, limita il danno di un
 * eventuale furto del token.
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const record = await RefreshToken.findOne({ where: { tokenHash: hashToken(refreshToken) } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findByPk(record.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    record.revokedAt = new Date();
    await record.save();

    const newToken = signAccessToken(user);
    const newRefreshToken = await issueRefreshToken(user.id);
    return res.json({ token: newToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_TTL });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};

/**
 * Logout REALE: revoca il refresh token indicato, impedendo di ottenere
 * nuovi access token con quella sessione. L'access token corrente resta
 * valido fino alla sua breve scadenza naturale (finestra accettata — vedi
 * ACCESS_TOKEN_TTL). Non richiede un access token valido: basta possedere il
 * refresh token, utile anche se l'access token è già scaduto.
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { tokenHash: hashToken(refreshToken), revokedAt: { [Op.is]: null } } },
      );
    }
    return res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    logger.error(`Error logging out: ${error.message}`);
    return res.status(200).json({ message: 'Logout successful.' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
