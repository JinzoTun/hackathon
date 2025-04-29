import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';
import errorHandler from './middlewares/error.middleware.js';
import cookieParser from 'cookie-parser';
import connectToDataBase from './database/mongodb.js';
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import chatRoutes from './routes/chat.routes.js'
import livekitRoutes from './routes/livekit.routes.js'
import plantIdRoutes from './routes/plantid.routes.js'
import alertRoutes from './routes/alert.routes.js'
import { sendMessage as sendMessageController } from './controllers/chat.controller.js';
import logger from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import { verifyJWTSocket } from './middlewares/auth.middleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'https://a9f0-102-173-29-148.ngrok-free.app',
    'https://6n63r50q-5173.uks1.devtunnels.ms'

];

// Configure CORS for Express
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Configure Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(logger('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/plantid', plantIdRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/livekit', livekitRoutes);

// Store online users
const onlineUsers = new Map();

// Socket.IO middleware for authentication
io.use(verifyJWTSocket);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.user.id);
    const userId = socket.user.id;

    // Add user to online users
    onlineUsers.set(userId, socket.id);
    console.log('Online users:', [...onlineUsers.keys()]);

    // Send online status to all connected users
    io.emit('userStatus', {
        userId: userId,
        status: 'online'
    });

    // Handle private messages
    socket.on('sendMessage', async ({ recipientId, content }) => {
        console.log('Message received from socket:', {
            senderId: userId,
            recipientId,
            content,
            timestamp: new Date().toISOString()
        });

        try {
            // Create a mock request and response object to use the controller directly
            const req = {
                user: { id: userId },
                body: { recipientId, content }
            };

            let responseData = null;

            const res = {
                status: (code) => {
                    console.log('Message controller response status:', code);
                    return {
                        json: (data) => {
                            console.log('Message controller response data:', JSON.stringify(data, null, 2));
                            responseData = data;
                            return res;
                        }
                    };
                }
            };

            // Call the controller function directly
            await sendMessageController(req, res, (err) => {
                if (err) {
                    console.error('Error in message controller:', err);
                    socket.emit('messageError', { error: 'Failed to send message' });
                }
            });

            if (responseData && responseData.success) {
                // Send to recipient if online
                const recipientSocketId = onlineUsers.get(recipientId);
                console.log('Recipient online status:', {
                    recipientId,
                    isOnline: !!recipientSocketId,
                    recipientSocketId: recipientSocketId || 'Not connected'
                });

                if (recipientSocketId) {
                    console.log('Sending message to recipient socket:', recipientSocketId);
                    io.to(recipientSocketId).emit('receiveMessage', responseData.message);
                    io.to(recipientSocketId).emit('notification', {
                        type: 'newMessage',
                        message: `New message from ${responseData.message.sender.name}`,
                        data: responseData.message
                    });
                }

                // Also send back to sender
                console.log('Sending confirmation back to sender');
                socket.emit('messageSent', responseData.message);
            } else {
                console.log('Message not sent, response data indicates failure or is null');
                socket.emit('messageError', { error: 'Failed to process message' });
            }
        } catch (error) {
            console.error('Error in socket message handler:', error);
            socket.emit('messageError', { error: 'Failed to send message: ' + error.message });
        }
    });

    // Handle typing indicators
    socket.on('typing', ({ recipientId }) => {
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('userTyping', { userId });
        }
    });

    socket.on('stopTyping', ({ recipientId }) => {
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('userStopTyping', { userId });
        }
    });

    // Handle disease alert notifications
    socket.on('newDiseaseAlert', (alert) => {
        // Broadcast to all online users in the specified radius
        // In a real app, we would filter by location and culture type here
        socket.broadcast.emit('diseaseAlertNotification', {
            type: 'diseaseAlert',
            message: `New disease alert for ${alert.plantType} detected in your area`,
            data: alert
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', userId);
        onlineUsers.delete(userId);
        io.emit('userStatus', {
            userId: userId,
            status: 'offline'
        });
    });
});

app.use(errorHandler);

server.listen(PORT, async () => {
    console.log(` API is running on http://localhost:${PORT}`);
    await connectToDataBase();
});