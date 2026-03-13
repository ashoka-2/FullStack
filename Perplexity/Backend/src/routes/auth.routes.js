
import {Router} from 'express';
import {registerUser,loginUser} from "../controllers/auth.controller.js"
import { loginValidator, registerValidator } from '../validators/auth.validator.js';


const authRouter = Router();


authRouter.post('/register',registerValidator,registerUser);
authRouter.post('/login',loginValidator,loginUser);
// authRouter.get('/logout',logoutUser);
// authRouter.get('/me',getGetMe);



export default authRouter;