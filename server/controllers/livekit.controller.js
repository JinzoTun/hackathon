import { AccessToken } from "livekit-server-sdk";
import { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from "../config/env.js";


const createParticipantToken = (userInfo, roomName) => {
    if (!userInfo || !userInfo.identity || !roomName) {
        throw new Error("Invalid user info or room name for token creation");
    }

    try {
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            ...userInfo,
            // Increase token validity to 30 minutes
            ttl: "30m",
        });
        const grant = {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
        };
        at.addGrant(grant);
        return at.toJwt();
    } catch (error) {
        console.error("Error creating LiveKit token:", error);
        throw new Error(`Failed to generate LiveKit token: ${error.message}`);
    }
};


export const getConnectionDetails = async (req, res) => {
    const { user } = req;

  
    try {
        if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            throw new Error("Environment variables are not defined");
        }

        const participantIdentity = user._id;
        // randomly generate a room name 
        const roomName = `room-${Math.random().toString(36).substring(2, 15)}`;
        // randomly generate a room id
        const newRoomId = `room-${Math.random().toString(36).substring(2, 15)}`;

        // Generate participant token with error handling
        let participantToken;
        try {
            participantToken = await createParticipantToken({ identity: participantIdentity }, newRoomId);
        } catch (tokenError) {
            console.error("Token generation error:", tokenError);
            return res.status(500).json({ error: "Failed to generate access token", details: tokenError.message });
        }

        const data = {
            serverUrl: LIVEKIT_URL,
            roomName: roomName,
            participantToken,
            participantName: user.name,
            roomId: newRoomId
        };

        res.set("Cache-Control", "no-store");
        res.json(data);
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ error: "Failed to create room", details: error.message });
    }
};







