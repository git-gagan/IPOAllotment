import express from "express";
import passport from 'passport';
import { agentDashboard, agentDashboardPost } from "../controllers/agent/index.js";


export const agentRouter = express.Router()

agentRouter.get("/agent-dashboard/", agentDashboard);
agentRouter.post("/agent-dashboard/", agentDashboardPost);