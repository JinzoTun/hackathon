import { Router } from "express";
import { signUp, signIn, signOut, refreshAccessToken, getMe, verifyEmail,resendOTP } from "../controllers/auth.controller.js";
import authorize from "../middlewares/auth.middleware.js";


const authRouter = Router();

authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);
authRouter.post("/refresh", refreshAccessToken); 
authRouter.get("/me", authorize, getMe);
authRouter.post("/verify", verifyEmail);
authRouter.post("/resend", resendOTP);

export default authRouter;

