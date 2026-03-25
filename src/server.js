import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3000;

// O '0.0.0.0' é essencial para o Docker no Render mapear a porta externa
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || 'production'})`);
  console.log(`[server] API URL: ${process.env.API_URL || 'http://localhost:' + PORT}`);
});