import { Router } from 'express';
import { getConnection } from 'typeorm';
import { User, Post } from '../entity';
import { NOT_FOUND, NO_CONTENT, BAD_REQUEST, OK, CREATED, NOT_IMPLEMENTED } from 'http-status-codes';

export const router = Router();

function repo() {
    return getConnection().manager.getRepository(Post);
}

router.post('/', async (req, res) => {
    try {
        const post = new Post();
        post.user = Promise.resolve(req.user!);
        post.title = req.body.title;
        post.contents = req.body.contents;
        post.createdAt = post.updatedAt = new Date();
        await repo().save(post);
        res.status(CREATED).json(post);
    } catch(e) {
        res.sendStatus(BAD_REQUEST);
    }
});

router.get('/', async (req, res) => {
    try {
        const post = await repo().find({
            where: {user: {id: req.user!.id}},
        });
        res.json(post);
    } catch(e) {
        res.sendStatus(NOT_FOUND);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const post = await repo().findOneOrFail({
            where: {
                id: req.params.id,
                user: {id: req.user!.id},
            },
        });
        res.json(post);
    } catch(e) {
        res.sendStatus(NOT_FOUND);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const post = await repo().findOneOrFail({
            where: {
                id: req.params.id,
                user: {id: req.user!.id}
            }
        });
        const {id, ...rest} = req.body;
        await repo().update(post, rest);
        res.sendStatus(NO_CONTENT);
    } catch(e) {
        res.sendStatus(NOT_FOUND);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const post = await repo().findOneOrFail({
            where: {
                id: req.params.id,
                user: {id: req.user!.id}
            }
        });
        await repo().remove(post);
        res.sendStatus(NO_CONTENT);
    } catch(e) {
        res.sendStatus(NOT_FOUND);
    }
});