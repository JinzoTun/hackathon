import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import mongoose from 'mongoose';

// Get all conversations for the current user
export const getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId
        }).populate({
            path: 'participants',
            select: 'name email'
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            conversations
        });
    } catch (error) {
        next(error);
    }
};

// Get messages between current user and another user
export const getMessages = async (req, res, next) => {
    try {
        const { recipientId } = req.params;
        const userId = req.user._id;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ success: false, message: 'Invalid recipient ID' });
        }

        // Get or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, recipientId] }
        });

        if (!conversation) {
            // If no messages yet, just return empty array
            return res.status(200).json({
                success: true,
                messages: []
            });
        }

        // Get messages
        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: recipientId },
                { sender: recipientId, recipient: userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { sender: recipientId, recipient: userId, read: false },
            { read: true }
        );

        // Reset unread counter for this conversation
        if (conversation.unreadCount && conversation.unreadCount.has(userId.toString())) {
            conversation.unreadCount.set(userId.toString(), 0);
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        next(error);
    }
};

// Send a message to another user
export const sendMessage = async (req, res, next) => {
    try {
        const { recipientId, content, isAdviceRequest, isAdviceResponse, relatedAdviceRequestId } = req.body;
        const senderId = req.user.id;

        // Validate input
        if (!content || !recipientId) {
            return res.status(400).json({
                success: false,
                message: 'Recipient ID and message content are required'
            });
        }

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ success: false, message: 'Invalid recipient ID' });
        }

        // Create new message with conseil fields if provided
        const newMessage = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content,
            isAdviceRequest: isAdviceRequest || false,
            isAdviceResponse: isAdviceResponse || false,
            relatedAdviceRequestId: relatedAdviceRequestId || null
        });

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, recipientId],
                lastMessage: content,
                unreadCount: new Map([[recipientId.toString(), 1]])
            });
        } else {
            // Update conversation
            conversation.lastMessage = content;
            const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
            conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
            await conversation.save();
        }

        // Get complete message with populated fields
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name')
            .populate('recipient', 'name');

        res.status(201).json({
            success: true,
            message: populatedMessage
        });

        // Socket.io emitting will be added later
    } catch (error) {
        next(error);
    }
};

// Get unread message counts
export const getUnreadCounts = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId,
            [`unreadCount.${userId}`]: { $gt: 0 }
        });

        const totalUnread = conversations.reduce((total, conv) => {
            return total + (conv.unreadCount.get(userId.toString()) || 0);
        }, 0);

        res.status(200).json({
            success: true,
            totalUnread,
            conversations: conversations.map(c => ({
                id: c._id,
                unread: c.unreadCount.get(userId.toString()) || 0
            }))
        });
    } catch (error) {
        next(error);
    }
};

// Rate an advice message
export const rateAdvice = async (req, res, next) => {
    try {
        const { messageId, rating } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!messageId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Message ID and rating (1-5) are required'
            });
        }

        // Validate message ID
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ success: false, message: 'Invalid message ID' });
        }

        // Find the message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if this is an advice message that can be rated
        if (!message.isAdviceResponse) {
            return res.status(400).json({
                success: false,
                message: 'Only advice responses can be rated'
            });
        }

        // Check if user is authorized to rate this message (must be recipient of the advice)
        if (message.recipient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only rate advice that was sent to you'
            });
        }

        // Update the message with the rating
        message.rating = rating;
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Advice rated successfully',
            data: { messageId, rating }
        });
    } catch (error) {
        next(error);
    }
};