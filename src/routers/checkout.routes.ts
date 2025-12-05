import express from "express";
import { checkout } from "../controller/checkout.controller";

const router = express.Router();

router.post("/", checkout);

export default router;