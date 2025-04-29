import { Router } from "express";
import {
    getNearbyAlerts,
    getAlertsByPlantType,
    getUserAlerts,
    deleteAlert
} from "../controllers/alert.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const alertRouter = Router();

// All routes require authentication
alertRouter.use(authorize);

// Get nearby alerts based on location
alertRouter.get('/nearby', getNearbyAlerts);

// Get alerts for a specific plant type
alertRouter.get('/plant/:plantType', getAlertsByPlantType);

// Get user's own alerts
alertRouter.get('/my-alerts', getUserAlerts);

// Delete an alert
alertRouter.delete('/:id', deleteAlert);

export default alertRouter;