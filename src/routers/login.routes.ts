import express from "express";
import { login } from "../controller/login.controller";
import { register } from "../controller/register.controller";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
export default router;
