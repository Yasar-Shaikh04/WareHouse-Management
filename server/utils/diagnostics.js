const mongoose = require('mongoose');

// Diagnostics context: never include credentials, password hashes or session secrets.
const runtimeContext = () => ({
  env: process.env.NODE_ENV || 'development',
  db: `${mongoose.connection.host}/${mongoose.connection.name}`,
});

const logAuthEvent = (event, details) => {
  console.log(`[Auth][${event}]`, JSON.stringify({ ...runtimeContext(), ...details }));
};

module.exports = { logAuthEvent, runtimeContext };
