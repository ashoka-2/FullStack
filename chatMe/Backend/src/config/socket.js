const { Server } = require('socket.io');

const initSocket = (server) => {
    const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : '*';

    const io = new Server(server, {
        cors: {
            // Frontend URL environments se le rahe hain
            origin: allowedOrigin, 
            methods: ["GET", "POST"]
        }
    });

    let users = [];

    io.on('connection', (socket) => {
        console.log(`New user connected: ${socket.id}`);

        // Jab user login karega (username register karega)
        socket.on('login', (username) => {
            const cleanName = username.trim();
            
            // Purane dead connections saaf kar rahe hain
            users = users.filter(u => u.username.toLowerCase() !== cleanName.toLowerCase() || u.id === socket.id);
            
            // Check kar rahe hain ki kya koi aur user pehle se is naam se online hai
            const nameExists = users.find(u => u.username.toLowerCase() === cleanName.toLowerCase() && u.id !== socket.id);
            
            if (nameExists) {
                console.log(`Login Denied: ${cleanName} (Already taken)`);
                socket.emit('loginError', 'This username is already taken.');
                return;
            }

            // Agar unique hai, toh login successful
            const user = { id: socket.id, username: cleanName, isBusy: false };
            const existingIndex = users.findIndex(u => u.id === socket.id);
            if (existingIndex !== -1) {
                users[existingIndex] = user;
            } else {
                users.push(user);
            }
            
            console.log(`User Logged In: ${cleanName} (ID: ${socket.id})`);
            socket.emit('loginSuccess', cleanName);
            io.emit('onlineUsers', users);
            
            socket.broadcast.emit('message', {
                user: 'System',
                text: `${cleanName} joined the chat! 👋`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isPrivate: false
            });
        });

        // Global chat logic
        socket.on('sendMessage', (message) => {
            const user = users.find(u => u.id === socket.id);
            if (user) {
                io.emit('message', {
                    user: user.username,
                    text: message,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isPrivate: false
                });
            }
        });

        // Specific user ko message bhejni ke liye (Private)
        socket.on('sendPrivateMessage', ({ to, text }) => {
            const sender = users.find(u => u.id === socket.id);
            const recipient = users.find(u => u.username.toLowerCase() === to.username.toLowerCase());

            if (sender && recipient) {
                const messageData = {
                    from: sender.username,
                    to: recipient.username,
                    text: text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isPrivate: true
                };

                socket.emit('privateMessage', messageData);
                io.to(recipient.id).emit('privateMessage', messageData);
            }
        });

        // Video/Audio Calling logic (Signaling)
        socket.on('callUser', ({ userToCall, signalData, from, type }) => {
            const recipient = users.find(u => u.id === userToCall);
            
            if (recipient && recipient.isBusy) {
                return socket.emit('callError', 'User is already on another call.');
            }

            // Mark users as busy
            users = users.map(u => (u.id === socket.id || u.id === userToCall) ? { ...u, isBusy: true } : u);
            io.emit('onlineUsers', users);

            io.to(userToCall).emit('hey', { signal: signalData, from, type });
        });

        socket.on('answerCall', (data) => {
            io.to(data.to).emit('callAccepted', data.signal);
        });

        socket.on('iceCandidate', (data) => {
            io.to(data.to).emit('iceCandidate', data.candidate);
        });

        socket.on('endCall', ({ to }) => {
            // Mark users as free again
            users = users.map(u => (u.id === socket.id || u.id === to) ? { ...u, isBusy: false } : u);
            io.emit('onlineUsers', users);
            io.to(to).emit('callEnded');
        });

        // Jab user disconnect ho jaye
        socket.on('disconnect', () => {
            const user = users.find(u => u.id === socket.id);
            if (user) {
                users = users.filter(u => u.id !== socket.id);
                console.log(`User Left: ${user.username}`);
                io.emit('onlineUsers', users);
            }
        });
    });

    return io;
};

module.exports = { initSocket };
