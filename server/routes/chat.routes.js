import express from 'express';
import { getConversations, getMessages, sendMessage, getUnreadCounts, rateAdvice } from '../controllers/chat.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply authentication to all chat routes
router.use(verifyJWT);

// Get all conversations of the current user
router.get('/conversations', getConversations);

// Get messages between two users
router.get('/messages/:recipientId', getMessages);

// Send a message to another user
router.post('/messages', sendMessage);

// Get unread message counts
router.get('/unread', getUnreadCounts);

// Rate advice
router.post('/rate-advice', rateAdvice);

export default router;