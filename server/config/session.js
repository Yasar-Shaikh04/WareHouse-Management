const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const getSessionMiddleware = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required in production');
  }

  return session({
    secret: process.env.SESSION_SECRET || 'warehouse_fallback_secret_key_123',
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      clientPromise: mongoose.connection.asPromise().then((conn) => conn.getClient()),
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
};

module.exports = { getSessionMiddleware };