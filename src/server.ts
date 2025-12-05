import express from 'express';
import cors from 'cors';
import path, { join } from 'path';
import googleRouter from "./routers/google.router";
import categoryRoutes from './routers/category.routes';
import productRoutes from './routers/product.routes';
import loginRoutes from './routers/login.routes';
import cartRoutes from './routers/cart.routes';
import checkoutRoutes from './routers/checkout.routes'
import adminProducts from './routers/adminProducts';
import adminCategories from './routers/adminCategories';

const app = express();

// ⭐ ENABLE CORS BEFORE ROUTES ⭐
app.use(cors({
  origin: "*", // OR ["http://localhost:4200"]
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

// Serve images
const imagesPath = join(__dirname, '../assets/images');
app.use('/assets/images', express.static(imagesPath));

// API routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', loginRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/categories', adminCategories);
app.use("/auth", googleRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
