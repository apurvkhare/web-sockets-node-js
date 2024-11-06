const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('public'));

// Track connected users and their rooms
const users = new Map();

// Store message history for each room
const roomMessages = new Map();

// Initialize default rooms with empty message history
['room1', 'room2', 'room3'].forEach(room => {
    roomMessages.set(room, []);
});

// Maximum number of messages to keep in history per room
const MAX_MESSAGES = 50;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    users.set(socket.id, { 
        rooms: new Set(),
        username: `User${socket.id.substr(0, 4)}`  // Create a shorter username
    });

    // Handle joining rooms
    socket.on('joinRoom', ({ room, username }) => {
        console.log(`Socket ${socket.id} joining ${room}`);
        
        // Leave previous room if any
        Array.from(users.get(socket.id).rooms).forEach(oldRoom => {
            socket.leave(oldRoom);
            users.get(socket.id).rooms.delete(oldRoom);
        });

        // Join new room
        socket.join(room);
        users.get(socket.id).rooms.add(room);

        users.get(socket.id).username = username;

        // Get message history for the room
        const messageHistory = roomMessages.get(room) || [];
        
        // Send room history to the joining user
        socket.emit('roomHistory', {
            room: room,
            messages: messageHistory
        });

        // Broadcast to others in the room
        io.to(room).emit('message', {
            type: 'system',
            room: room,
            username: 'System',
            message: `${users.get(socket.id).username} joined the room`,
            timestamp: new Date()
        });
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        const user = users.get(socket.id);
        if (!user) return;

        const messageData = {
            type: 'user',
            room: data.room,
            username: user.username,
            message: data.message,
            timestamp: new Date()
        };

        // Store message in room history
        const roomHistory = roomMessages.get(data.room) || [];
        roomHistory.push(messageData);
        
        // Keep only the last MAX_MESSAGES messages
        if (roomHistory.length > MAX_MESSAGES) {
            roomHistory.shift();
        }
        roomMessages.set(data.room, roomHistory);

        // Broadcast to all clients in the room (including sender)
        io.to(data.room).emit('message', messageData);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            // Notify all rooms the user was in
            user.rooms.forEach(room => {
                io.to(room).emit('message', {
                    type: 'system',
                    room: room,
                    username: 'System',
                    message: `${user.username} left the room`,
                    timestamp: new Date()
                });
            });
        }
        users.delete(socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});