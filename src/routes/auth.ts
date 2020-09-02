import { Router } from 'express';
import { getConnection, LessThan } from 'typeorm';
import { User, RefreshToken } from '../entity';
import * as models from '../entity/User';
import * as jwt from '../utils/jwt-utils';
import * as crypt from '../utils/crypt-utils';
import secretObj from '../../coverage/jwt';
import { BAD_REQUEST, UNAUTHORIZED, NO_CONTENT, CONFLICT, CREATED, NOT_FOUND, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { minLength, validate } from 'class-validator';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import passport from 'passport';
import randToken from 'rand-token';

declare global {
    namespace Express {
        interface User extends models.User {
        }
    }
}

export const router = Router();

function manager() {
    return getConnection().manager;
}

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
    try {
        const user = await manager().findOneOrFail(User, {
            where: {email: req.body.email}
        });
        const ok = await crypt.compare(req.body.password, user.password);
        if(ok) {
            const refresh = new RefreshToken();
            const now = new Date();
            const exp = new Date(now);
            exp.setDate(exp.getDate() + 2);
            refresh.exp = exp;
            refresh.token = await generateRefreshToken();
            refresh.user = Promise.resolve(user);
            const token = await generateToken(user);
            
            await manager().delete(RefreshToken, {
                user: {id: user.id},
                exp: LessThan(now),
            });
            await manager().save(refresh);
    
            res.json({
                token,
                refreshToken: refresh.token
            });
        } else {
            res.sendStatus(BAD_REQUEST);
        }
    } catch(e) {
        res.sendStatus(BAD_REQUEST);
    }
});

router.post('/jwt/refresh', async (req, res) => {
    const token = req.body.token;
    const decoded = jwt.decode(token) as any;
    if(!decoded || !decoded.email) return res.sendStatus(UNAUTHORIZED);

    const refreshToken = await manager().findOne(RefreshToken, req.body.refreshToken);
    if(refreshToken && refreshToken.exp > new Date()) {
        const user = await manager().findOneOrFail(User, {
            where: {email: decoded.email}
        });
        res.json({token: await generateToken(user)});
    } else {
        await manager().delete(RefreshToken, req.body.refreshToken);
        res.sendStatus(UNAUTHORIZED);
    }
});

router.delete('/jwt/refresh', async (req, res) => {
    const refreshToken = await manager().findOne(RefreshToken, req.body.refreshToken);
    if(refreshToken) {
        await manager().remove(refreshToken);
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

async function generateToken(user: User) {
    return jwt.sign({
        id: user.id,
        email: user.email
    }, secretObj.secret, {expiresIn: '5m'});
}

async function generateRefreshToken(): Promise<string> {
    let refreshToken: string | null = null;
    for(let i = 0; i < 5; i++) {
        const uid = randToken.uid(32);
        const count = await manager().count(RefreshToken, {
            where: {token: uid}
        });
        if(count === 0) {
            refreshToken = uid;
        }
    }
    if(refreshToken) {
        return refreshToken;
    } else {
        return Promise.reject('cannot generate a refresh token');
    }
}