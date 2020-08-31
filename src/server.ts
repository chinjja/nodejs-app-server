import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as users from './routes/users';
import * as login from './routes/login';

export const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(login.router);
app.use('/static', express.static(path.resolve(__dirname, '../public')));
app.use('/users', users.router);

export default app;