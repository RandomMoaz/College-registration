// Vercel serverless entry point.
// Wraps the Express app so every /api/* request (routed here by vercel.json)
// is handled by the same server used locally. The app is exported without
// calling app.listen(), which Vercel's Node runtime requires.
module.exports = require('../Backend/server.js');
