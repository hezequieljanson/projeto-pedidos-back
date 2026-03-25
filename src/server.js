import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3000;

// O '0.0.0.0' é importante para o Render/Docker
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || 'production'})`);
  console.log(`[server] Swagger docs: ${process.env.API_URL || 'http://localhost:' + PORT}/api/docs`);
});