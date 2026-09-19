import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';

// Prioritize IPv4 and disable autoSelectFamily to prevent IPv6/NAT64 timeouts on Windows
dns.setDefaultResultOrder('ipv4first');
if (http.globalAgent) (http.globalAgent as any).options.autoSelectFamily = false;
if (https.globalAgent) (https.globalAgent as any).options.autoSelectFamily = false;

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
import aiRouter from './routes/aiRoute.js';


const app = express();

const allowedOrigins = [
    'https://mkb-smart-adminfrontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8081',
];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (mobile apps, server-to-server, curl)
        if (!origin) return callback(null, true);

        const normalized = origin.replace(/\/+$/, '');
        const isAllowed =
            allowedOrigins.includes(normalized) ||
            normalized.endsWith('.vercel.app') ||
            (process.env.ADMIN_FRONTEND_URL && normalized === process.env.ADMIN_FRONTEND_URL.replace(/\/+$/, '')) ||
            (process.env.FRONTEND_URL && normalized === process.env.FRONTEND_URL.replace(/\/+$/, ''));

        if (isAllowed) {
            return callback(null, true);
        }

        // Return true to avoid blocking legitimate preview/production domains
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
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
app.use('/api/ai', aiRouter);



//Error handling
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: error.message });
});

// Only start the HTTP listener for standalone/local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} (0.0.0.0)`);
    });
}

export default app;
