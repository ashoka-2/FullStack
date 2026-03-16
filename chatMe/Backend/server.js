const app = require('./src/app');
const http = require('http');
const { initSocket } = require('./src/config/socket');
const dotenv = require('dotenv');

// Config load kar rahe hain .env se
dotenv.config();

const server = http.createServer(app);

// Socket.io initialization yahan ho rahi hai
initSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server chalu ho gaya hai port ${PORT} pe! 🚀`);
});
