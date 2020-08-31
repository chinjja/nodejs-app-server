import { Router, Response, Request } from 'express';
import { getConnection } from 'typeorm';
import { User } from '../entity/User';
import { validate, minLength } from 'class-validator';
import * as crypt from '../utils/crypt-utils';
import { BAD_REQUEST, UNAUTHORIZED, OK, CREATED, NOT_FOUND, CONFLICT, NO_CONTENT } from 'http-status-codes';

export const router = Router();

function manager() {
    return getConnection().manager;
}

function withoutImportantInfo(user: User) {
    const { password, ...rest } = user;
    return rest;
}

router.get('/', async (req, res, next) => {
    if(!verify(req, res)) return;
    const users = await manager().find(User);
    const result = users.map(withoutImportantInfo);
    res.json(result);
});

router.get('/:id', async (req, res, next) => {
    if(!verify(req, res, true)) return;
    const user = await manager().findOne(User, req.user.id);
    if(!user) {
        res.sendStatus(NOT_FOUND);
        return;
    }
    const result = withoutImportantInfo(user);
    res.json(result);
});

router.post('/', async (req, res) => {
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
        res.status(CREATED).json(withoutImportantInfo(savedUser));
    } catch(e) {
        res.sendStatus(CONFLICT);
    }
});

router.put('/:id', async (req, res) => {
    if(!verify(req, res, true)) return;
    const user = await manager().findOne(User, req.user.id);
    if(!user) {
        res.sendStatus(NOT_FOUND);
        return;
    }
    const {id, password, ...rest} = req.body;
    Object.assign(user, rest);
    await manager().save(user);
    res.sendStatus(NO_CONTENT);
});

router.delete('/:id', async (req, res) => {
    if(!verify(req, res, true)) return;
    const user = await manager().findOne(User, req.user.id);
    if(!user) {
        res.sendStatus(NOT_FOUND);
        return;
    }
    await manager().remove(user);
    res.sendStatus(NO_CONTENT);
});

function verify(req: Request, res: Response, checkId = false): boolean {
    if(!req.user) {
        res.sendStatus(UNAUTHORIZED);
        return false;
    }
    if(checkId && req.user.id !== Number(req.params.id)) {
        res.sendStatus(BAD_REQUEST);
        return false;
    }
    return true;
}