const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserModel = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password, displayName } = req.body;

    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await UserModel.create({ email, password, displayName });
    const token = signToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user || !(await UserModel.verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(422).json({ error: 'Missing Google credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await UserModel.findByGoogleId(googleId);
    if (!user) {
      user = await UserModel.findByEmail(email);
      if (user) {
        await UserModel.linkGoogleId(user.id, googleId);
      } else {
        user = await UserModel.createWithGoogle({ email, displayName: name, googleId });
      }
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, googleAuth };
