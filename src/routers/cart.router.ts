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


// import express from "express";
// import {
//   getAllCartItems,
//   getCartItemById,
//   addCartItem,
//   updateCartItem,
//   deleteCartItem,
//   clearCart
// } from "../controller/cart.controller";

// const router = express.Router();

// router.get("/", getAllCartItems);
// router.get("/:id", getCartItemById);
// router.post("/", addCartItem);
// router.put("/:id", updateCartItem);
// router.delete("/:id", deleteCartItem);
// router.delete("/", clearCart); // optional

// export default router;