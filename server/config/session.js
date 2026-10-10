const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const getSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'warehouse_fallback_secret_key_123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      clientPromise: mongoose.connection.asPromise().then((conn) => conn.getClient()),
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day in seconds
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
};

module.exports = { getSessionMiddleware };
