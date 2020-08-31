import { Router } from 'express';
import { getConnection } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from '../utils/jwt-utils';
import * as crypt from '../utils/crypt-utils';
import secretObj from '../../coverage/jwt';
import { BAD_REQUEST, OK, UNAUTHORIZED, NO_CONTENT } from 'http-status-codes';

declare global {
    namespace Express {
        interface Request {
            user: User;
        }
    }
}

export const router = Router();

function manager() {
    return getConnection().manager;
}

router.use(async (req, res, next) => {
    try {
        const decoded = await jwt.verify(req.cookies.token, secretObj.secret) as any;
        const user = await manager().findOne(User, { where: {email: decoded.email}});
        if (user) {
            req.user = user;
        }
    } catch(e) {

    } finally {
        next();
    }
});

interface RefreshTokenDB {
    [refreshToken: string]: string;
}
const refreshTokens: RefreshTokenDB = {}

router.post('/login', async (req, res) => {
    const user = await manager().findOne(User, {
        where: {email: req.body.email}
    });
    if(!user) {
        res.sendStatus(BAD_REQUEST);
        return;
    }
    const ok = await crypt.compare(req.body.password, user.password);
    if(ok) {
        const token = await jwt.sign({
            email: user.email
        }, secretObj.secret, {expiresIn: '5m'});
        const refreshToken = await jwt.sign({}, secretObj.secret, {expiresIn: '2d'});
        refreshTokens[refreshToken] = user.email; // DB

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 5*60*1000
        });
        res.json({
            token,
            refreshToken
        });
    } else {
        res.sendStatus(BAD_REQUEST);
    }
});

router.post('/token', async (req, res) => {
    const email = req.body.email;
    const refreshToken = req.body.refreshToken;
    if((refreshToken in refreshTokens) && (refreshTokens[refreshToken] === email)) {
        const token = await jwt.sign({
            email
        }, secretObj.secret, {expiresIn: '5m'});
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 5*60*1000
        });
        res.sendStatus(NO_CONTENT);
    } else {
        res.sendStatus(UNAUTHORIZED);
    }
});

router.delete('/token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if(refreshToken in refreshTokens) {
        delete refreshTokens[refreshToken];
        res.clearCookie('token');
        res.sendStatus(NO_CONTENT);
    } else {
        res.sendStatus(BAD_REQUEST);
    }
});