import express from "express";
import passport from 'passport';
import { agentDashboard } from "../controllers/agent/index.js";


export const agentRouter = express.Router()

agentRouter.get("/agent-dashboard/", agentDashboard);