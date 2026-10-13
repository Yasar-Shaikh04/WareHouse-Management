const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// Decide whether we need cross-site, HTTPS-only session cookies.
//
// The Vercel frontend and the Render backend run on different sites, so the
// session cookie must be sent on cross-origin XHR. Browsers only allow that
// with `SameSite=None` + `Secure`, and `Secure` requires an HTTPS response.
//
// We can't rely on NODE_ENV alone: Render does not set NODE_ENV=production
// unless the developer configures it, which is exactly what silently downgraded
// the cookie to `SameSite=Lax` and caused the "Authentication required" 401s
// on the deployed dashboard while local (same-origin) development worked.
//
// So we treat the deployment as cross-site when either NODE_ENV is production
// OR the configured CLIENT_URL is an https:// origin (the real signal that we
// are serving a deployed frontend).
const isCrossSiteDeployment = () => {
  if (process.env.NODE_ENV === 'production') return true;
  const clientUrl = (process.env.CLIENT_URL || '').trim().toLowerCase();
  return clientUrl.startsWith('https://');
};

const getSessionMiddleware = () => {
  const crossSite = isCrossSiteDeployment();

  if (crossSite && !process.env.SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET is required for a cross-site/HTTPS deployment. Set it in Render environment variables.'
    );
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
      // 'auto' lets express-session decide the Secure attribute from req.secure,
      // which is already proxy-aware because app.set('trust proxy', 1) honors
      // Render's X-Forwarded-Proto header. Over the deployed HTTPS origin the
      // cookie is Secure (required for SameSite=None); over a plain local http
      // connection it is not, so the session cookie is still emitted and usable.
      secure: crossSite ? 'auto' : false,
      // Cross-site (deployed) frontend on a different origin than the backend
      // needs SameSite=None so the browser sends the cookie on credentialed XHR.
      // Local same-origin dev can keep Lax.
      sameSite: crossSite ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
};

module.exports = { getSessionMiddleware, isCrossSiteDeployment };
