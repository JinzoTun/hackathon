import express from "express";
import {
    getConnectionDetails,

} from "../controllers/livekit.controller.js";
import authorize from '../middlewares/auth.middleware.js';

const router = express.Router();

// Room creation and joining
router.get("/connection-details", authorize, getConnectionDetails);


export default router;