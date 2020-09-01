import express from 'express';
import path from 'path';
import * as routers from './routes';
import passport from 'passport';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(routers.auth);
app.use(passport.initialize());
app.use(passport.authenticate('jwt', {session: false}));
app.use('/static', express.static(path.resolve(__dirname, '../public')));
app.use('/users', routers.users);
app.use('/posts', routers.posts);

routers.config(passport);

export default app;