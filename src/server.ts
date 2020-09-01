import express from 'express';
import path from 'path';
import * as users from './routes/users';
import * as auth from './routes/auth';
import passport from 'passport';

export const app = express();
app.use(express.json());
app.use(passport.initialize());
app.use(auth.router);
app.use('/static', express.static(path.resolve(__dirname, '../public')));
app.use('/users', passport.authenticate('jwt', {session: false}), users.router);

auth.config(passport);

export default app;