import express from "express";
import { userRouter } from './users.js'
import { home } from '../controllers/full.js'


export const router = express.Router()

router.get('/', home)
router.use('/users', userRouter)
