import { Router } from "express";
import {
    addCultures,
    removeCulture,
    updateProfile,
    updateUserLocation,
    getCultureHistory,
    addCultureHistory,
    updateCultureHistory,
    deleteCultureHistory,
    getYieldStatistics,
    getCultureTypes,
    getCultureSummary,
    getAllUsers
} from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const userRouter = Router();

// All routes require authentication
userRouter.use(authorize);

// User listing route
userRouter.get('/', getAllUsers);

// Profile management routes
userRouter.put('/update-profile', updateProfile);
userRouter.put('/update-location', updateUserLocation);

// Culture management routes
userRouter.get('/culture-types', getCultureTypes);
userRouter.post('/add-cultures', addCultures);
userRouter.delete('/remove-culture/:id', removeCulture);

// Culture history routes
userRouter.get('/culture-history', getCultureHistory);
userRouter.post('/add-history', addCultureHistory);
userRouter.put('/update-history/:id', updateCultureHistory);
userRouter.delete('/delete-history/:id', deleteCultureHistory);

// Statistics routes
userRouter.get('/yield-statistics', getYieldStatistics);
userRouter.get('/culture-summary', getCultureSummary);

export default userRouter;