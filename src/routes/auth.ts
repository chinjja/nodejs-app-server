import { Router } from 'express';
import { getConnection } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from '../utils/jwt-utils';
import * as crypt from '../utils/crypt-utils';
import secretObj from '../../coverage/jwt';
import { BAD_REQUEST, UNAUTHORIZED, NO_CONTENT, CONFLICT, CREATED, NOT_FOUND } from 'http-status-codes';
import { minLength, validate } from 'class-validator';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import passport from 'passport';

declare global {
    namespace Express {
        interface User {
            id: number,
            email: string,
            password: string,
        }
    }
}

export const router = Router();

function manager() {
    return getConnection().manager;
}

interface RefreshTokenDB {
    [refreshToken: string]: string;
}
const refreshTokens: RefreshTokenDB = {}

router.post('/register', async (req, res) => {
    const password = req.body.password;
    if(!minLength(password, 8)) {
        res.status(BAD_REQUEST).send(`password's length must be 8 or more`);
        return;
    }
    const encodedPassword = await crypt.hash(password);
    const user = manager().create(User, { ...req.body, password: encodedPassword });
    const errors = await validate(user);
    if(errors.length > 0) {
        res.status(BAD_REQUEST).json(errors);
        return;
    }
    try {
        const savedUser = await manager().save(user);
        const {password, ...rest} = savedUser;
        res.status(CREATED).json(rest);
    } catch(e) {
        res.sendStatus(CONFLICT);
    }
});

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
            id: user.id,
            email: user.email
        }, secretObj.secret, {expiresIn: '5m'});
        const refreshToken = await jwt.sign({}, secretObj.secret, {expiresIn: '2d'});
        refreshTokens[refreshToken] = user.email; // DB

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
        res.json({token});
    } else {
        res.sendStatus(UNAUTHORIZED);
    }
});

router.delete('/token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if(refreshToken in refreshTokens) {
        delete refreshTokens[refreshToken];
        res.sendStatus(NO_CONTENT);
    } else {
        res.sendStatus(BAD_REQUEST);
    }
});

export const config = async (passport: passport.Authenticator) => {
    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: secretObj.secret,
    }, async (payload, done) => {
        try {
            const user = await manager().findOneOrFail(User, payload.id);
            done(null, user);
        } catch(e) {
            done(e);
        }
    }));
};