import express from "express";
import {
  getAllCartItems,
  getCartItemById,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  getcartByUserId,
} from "../controller/cart.controller";

const router = express.Router();

// 🔥 IMPORTANT — Place user route BEFORE :id route
router.get("/user/:user_Id", getcartByUserId);

router.get("/", getAllCartItems);
router.get("/:id", getCartItemById);

router.post("/", addCartItem);
router.put("/:id", updateCartItem);

router.delete("/:user_id/:product_id", deleteCartItem);

export default router;
