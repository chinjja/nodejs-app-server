import supertest from 'supertest';
import api from '../../src/server';
import { CREATED, OK, CONFLICT, UNAUTHORIZED, NOT_FOUND, NO_CONTENT, BAD_REQUEST } from 'http-status-codes';
import connection from '../connection';

const server = supertest.agent(api);

beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
});

beforeEach(async () => {
    await connection.create();
});

afterEach(async () => {
    await connection.close();
});

describe('without login', () => {
    test('get /posts', async () => {
        await server
        .get('/posts')
        .expect(UNAUTHORIZED);
    });

    test('get /posts/1', async () => {
        await server
        .get('/posts/1')
        .expect(UNAUTHORIZED);
    });

    test('post /posts', async () => {
        await server
        .post('/users')
        .send({
            title: 'hello',
            contents: 'world',
        })
        .expect(UNAUTHORIZED);
    });
});

describe('with login', () => {
    const email = 'chinjja@gmail.com';
    const password = '12345678';
    let token: string;
    let refreshToken: string;

    beforeEach(async () => {
        await server
        .post('/register')
        .send({email, password})
        .expect(CREATED);
        
        const res = await server
        .post('/login')
        .send({email, password})
        .expect(OK);
        token = res.body.token;
        refreshToken = res.body.refreshToken;
    });

    test('get /posts', async () => {
        const res = await server
        .get('/posts')
        .auth(token, {type: 'bearer'})
        .expect(OK);
        expect(res.body).toHaveLength(0);
    });

    test('get /posts/1', async () => {
        await server
        .get('/posts/1')
        .auth(token, {type: 'bearer'})
        .expect(NOT_FOUND);
    });

    test('post /posts', async () => {
        const res = await server
        .post('/posts')
        .auth(token, {type: 'bearer'})
        .send({
            title: 'hello',
            contents: 'world',
        })
        .expect(CREATED);
        expect(res.body.title).toEqual('hello');
        expect(res.body.contents).toEqual('world');
    });
});

describe('with sample posts', () => {
    const email = 'chinjja@gmail.com';
    const password = '12345678';
    let token: string;
    let refreshToken: string;

    beforeEach(async () => {
        await server
        .post('/register')
        .send({email, password})
        .expect(CREATED);
        
        const res = await server
        .post('/login')
        .send({email, password})
        .expect(OK);
        token = res.body.token;
        refreshToken = res.body.refreshToken;

        for(let i = 0; i < 10; i++) {
            await server
            .post('/posts')
            .auth(token, {type: 'bearer'})
            .send({
                title: `post${i}`,
                contents: `contents${i}`,
            })
            .expect(CREATED);
        }
    });

    test('get /posts', async () => {
        const res = await server
        .get('/posts')
        .auth(token, {type: 'bearer'})
        .expect(OK);
        expect(res.body).toHaveLength(10);
    });

    test('get /posts/1', async () => {
        await server
        .get('/posts/1')
        .auth(token, {type: 'bearer'})
        .expect(OK);
    });

    test('get /posts/9999', async () => {
        await server
        .get('/posts/9999')
        .auth(token, {type: 'bearer'})
        .expect(NOT_FOUND);
    });

    test('post /posts', async () => {
        await server
        .post('/posts')
        .auth(token, {type: 'bearer'})
        .send({
            title: 'hello',
            contents: 'world',
        })
        .expect(CREATED);
    });

    test('delete /posts/1', async () => {
        await server
        .delete('/posts/1')
        .auth(token, {type: 'bearer'})
        .expect(NO_CONTENT);
    });

    test('delete /posts/9999', async () => {
        await server
        .delete('/posts/9999')
        .auth(token, {type: 'bearer'})
        .expect(NOT_FOUND);
    });
});