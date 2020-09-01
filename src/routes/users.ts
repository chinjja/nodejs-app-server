import { Router, Response, Request } from 'express';
import { getConnection } from 'typeorm';
import { User } from '../entity/User';
import { NOT_FOUND, NO_CONTENT } from 'http-status-codes';

export const router = Router();

function manager() {
    return getConnection().manager;
}

function withoutImportantInfo(user: User) {
    const { password, ...rest } = user;
    return rest;
}

router.get('/', async (req, res) => {
    const users = await manager().find(User);
    const result = users.map(withoutImportantInfo);
    res.json(result);
});

router.get('/:id', async (req, res) => {
    const user = await manager().findOne(User, req.user!.id);
    if(!user) {
        res.sendStatus(NOT_FOUND);
        return;
    }
    const result = withoutImportantInfo(user);
    res.json(result);
});

router.get('/current', async (req, res) => {
    const user = await manager().findOne(User, req.user!.id);
    if(!user) {
        res.sendStatus(NOT_FOUND);
    } else {
        const {password, ...rest} = user;
        res.json(rest);
    }
});

router.put('/:id', async (req, res) => {
    const user = await manager().findOne(User, req.user!.id);
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
    const user = await manager().findOne(User, req.user!.id);
    if(!user) {
        res.sendStatus(NOT_FOUND);
        return;
    }
    await manager().remove(user);
    res.sendStatus(NO_CONTENT);
});