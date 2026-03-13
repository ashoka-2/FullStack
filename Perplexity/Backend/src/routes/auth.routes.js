
import {Router} from 'express';
import {registerUser,loginUser, verifyEmail, logoutUser, getMe} from "../controllers/auth.controller.js"
import { loginValidator, registerValidator } from '../validators/auth.validator.js';
import {authUser} from "../middlewares/auth.middleware.js";


const authRouter = Router();


authRouter.get("/verify-email",verifyEmail)

authRouter.post('/register',registerValidator,registerUser);
authRouter.post('/login',loginValidator,loginUser);
authRouter.get('/logout',logoutUser);
authRouter.get('/me',authUser,getMe);



export default authRouter;