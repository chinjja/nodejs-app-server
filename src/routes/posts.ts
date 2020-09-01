import { Router } from 'express';
import { getConnection } from 'typeorm';
import { User, Post } from '../entity';
import { NOT_FOUND, NO_CONTENT, BAD_REQUEST, OK, CREATED, NOT_IMPLEMENTED } from 'http-status-codes';

export const router = Router();

function manager() {
    return getConnection().manager;
}

router.post('/', async (req, res) => {
    const post = new Post();
    post.user = Promise.resolve(req.user!);
    post.title = req.body.title;
    post.contents = req.body.contents;
    post.createdAt = post.updatedAt = new Date();
    try {
        await manager().save(post);
        res.status(CREATED).json(post);
    } catch(e) {
        res.sendStatus(BAD_REQUEST);
    }
});

router.get('/', async (req, res) => {
    res.json(await req.user!.posts);
});

router.get('/:id', async (req, res) => {
    try {
        const post = manager().findOneOrFail(Post, req.params.id);
        res.json(post);
    } catch(e) {
        res.sendStatus(NOT_FOUND);
    }
});

router.put('/:id', async (req, res) => {
    res.sendStatus(NOT_IMPLEMENTED);
});

router.delete('/:id', async (req, res) => {
    try {
        await manager().delete(Post, req.params.id);
        res.sendStatus(NO_CONTENT);
    } catch(e) {
        res.sendStatus(NOT_FOUND);
    }
});