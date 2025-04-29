import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import User from '../models/user.model.js';

export const verifyJWT = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};

// Socket.IO authentication middleware
export const verifyJWTSocket = async (socket, next) => {
    try {
        console.log('Socket authentication attempt');
        const token = socket.handshake.auth.token;

        if (!token) {
            console.log('Socket auth failed: No token provided');
            return next(new Error('Authentication error: Token missing'));
        }

        console.log('Socket token received:', token.substring(0, 15) + '...');

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('Token decoded successfully:', decoded.userId);

            const user = await User.findById(decoded.userId);

            if (!user) {
                console.log('Socket auth failed: User not found for ID', decoded.userId);
                return next(new Error('Authentication error: User not found'));
            }

            // Store user and token in socket for future use
            socket.user = {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            };
            socket.token = token;

            console.log('Socket authenticated successfully for user:', user.name);
            next();
        } catch (jwtError) {
            console.log('Socket auth failed: JWT verification error', jwtError.message);
            next(new Error('Authentication error: Invalid token'));
        }
    } catch (error) {
        console.log('Socket auth failed with unexpected error:', error.message);
        next(new Error('Authentication error: ' + error.message));
    }
};

export default verifyJWT;