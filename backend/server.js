import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import { detectUserColumns } from './models/users.js';

// routes
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import reportsRouter from './routes/reports.js';
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger 設定
const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SecondHand - API',
            version: '0.1.0',
            description: '二手交易平台 API 文件',
        },
        servers: [{ url: 'http://localhost:3000' }],
    },
    apis: [path.join(__dirname, 'routes/*.js')], // 讓它去掃 routes 裡的註解
});

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// 靜態頁
app.use('/login', express.static(path.join(__dirname, 'public/login')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/buyer', express.static(path.join(__dirname, 'public/buyer')));
app.use('/seller', express.static(path.join(__dirname, 'public/seller')));
app.use('/sign', express.static(path.join(__dirname, 'public/sign')));
app.get('/login', (_req, res) => res.redirect('/login/login.html'));

// 掛 routes
app.use(authRouter);
app.use(usersRouter);
app.use(reportsRouter);
app.use('/api/order', ordersRouter);
app.use('/api/products', productsRouter);

const port = Number(process.env.PORT || 3000);

(async () => {
    await detectUserColumns(); // 啟動前先偵測欄位一次
    app.listen(port, () => console.log('Backend running on :' + port));
})();
