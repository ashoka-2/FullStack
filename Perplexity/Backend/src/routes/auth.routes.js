
import {Router} from 'express';
import {registerUser,loginUser, verifyEmail, logoutUser, getMe, resendVerificationEmail, connectInstagram} from "../controllers/auth.controller.js"
import { loginValidator, registerValidator } from '../validators/auth.validator.js';
import {authUser} from "../middlewares/auth.middleware.js";


const authRouter = Router();


authRouter.get("/verify-email",verifyEmail)

authRouter.post("/resend-verification-email",resendVerificationEmail)

authRouter.post('/register',registerValidator,registerUser);
authRouter.post('/login',loginValidator,loginUser);
authRouter.post('/logout',logoutUser);
authRouter.get('/me',authUser,getMe);
authRouter.post('/connect-instagram', authUser, connectInstagram);



export default authRouter;