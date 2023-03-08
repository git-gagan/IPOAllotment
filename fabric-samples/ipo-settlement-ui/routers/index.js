import express from "express";
import { userRouter } from './users.js'
import { home } from '../controllers/full.js'
import { issuerRouter } from "./issuer.js";
import { logOut } from "../controllers/users/index.js";

export const router = express.Router()

// TODO:  Add authorization using passportJS
router.get('/', home)
router.use('/users', userRouter)
router.use('/issuer', issuerRouter)
router.get('/logout/', logOut);
