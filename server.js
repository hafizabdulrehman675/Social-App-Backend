const http = require('http');
const app = require('./app');
const sequelize = require('./config/connection');
const { initSocketServer } = require('./socket/socketServer');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected successfully!');
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to database:', err);
  });
