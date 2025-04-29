import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }],
        lastMessage: {
            type: String,
            default: "",
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        }
    },
    {
        timestamps: true,
    }
);

// Creating a compound index to ensure unique conversations between two users
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;