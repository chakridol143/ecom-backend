import express from "express";
import {
  getAllCartItems,
  getCartItemById,
  addCartItem,
  updateCartItem,
  deleteCartItem,
} from "../controller/cart.controller";

const router = express.Router();

router.get("/", getAllCartItems);
router.get("/:id", getCartItemById);
router.post("/", addCartItem);
router.put("/:id", updateCartItem);
router.delete("/:id", deleteCartItem);

export default router;