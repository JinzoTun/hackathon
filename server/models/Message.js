import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },

        isAdviceRequest: {
            type: Boolean,
            default: false,
        },
        isAdviceResponse: {
            type: Boolean,
            default: false,
        },
        relatedAdviceRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;