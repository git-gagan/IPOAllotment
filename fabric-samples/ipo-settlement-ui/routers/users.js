import express from "express";
import passport from 'passport';
import {
    logIn, postLogin, postRegisterInvestorStep3,
    postRegisterStep1, postRegisterStep2, registerInvestorStep3,
    registerStep1, registerStep2
} from '../controllers/users/index.js';


export const userRouter = express.Router()

userRouter.get('/register-step1/', registerStep1)
userRouter.post('/register-step1/', postRegisterStep1)
userRouter.get('/register-step2/', registerStep2)
userRouter.post('/register-step2/', postRegisterStep2)
userRouter.get('/register-step3/', registerInvestorStep3)
userRouter.post('/register-investor-step3/', postRegisterInvestorStep3)
userRouter.get('/login/', logIn)
userRouter.post('/login/',
    passport.authenticate('local', { failureRedirect: '/users/login' }), postLogin)
