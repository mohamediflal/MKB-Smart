import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRouter from './routes/authRoutes.js';
import cartRouter from './routes/cartRoute.js';
import productRouter from './routes/productRoute.js';
import orderRouter from './routes/orderRoute.js';
import addressRouter from './routes/addressRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import favoriteRouter from './routes/favoriteRoute.js';
import notificationRouter from './routes/notificationRoute.js';


const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => res.send('Server is Live'));

app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/address', addressRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/notifications', notificationRouter);


//Error handling
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: error.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
