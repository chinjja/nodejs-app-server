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

test('create user', async () => {
    const email = 'chinjja@gmail.com';
    const password = '12345678';
    const res1 = await server
    .post('/users')
    .send({email, password})
    .expect(CREATED);
    expect(res1.body.id).toEqual(1);
    expect(res1.body.email).toEqual(email);
    expect(res1.body.password).toBeUndefined();
});

test('create user with conflict', async () => {
    const email = 'chinjja@gmail.com';
    const password = '12345678';

    await server
    .post('/users')
    .send({email, password})
    .expect(CREATED);

    await server
    .post('/users')
    .send({email, password})
    .expect(CONFLICT);
});

describe('without login', () => {
    test('unauthorized /users', async () => {
        await server
        .get('/users')
        .expect(UNAUTHORIZED);
    });
    
    test('unauthorized /users/:id', async () => {
        await server
        .get('/users/1')
        .expect(UNAUTHORIZED);
    });
    
    test('delete /users/1', async () => {
        await server
        .delete('/users/1')
        .expect(UNAUTHORIZED);
    });
});

describe('with login', () => {
    const email = 'chinjja@gmail.com';
    const password = '12345678';
    let refreshToken: string;

    beforeEach(async () => {
        await server
        .post('/users')
        .send({email, password})
        .expect(CREATED);
        
        const res = await server
        .post('/login')
        .send({email, password})
        .expect(OK);
        refreshToken = res.body.refreshToken;
        expect(refreshToken).not.toBeUndefined();
    });

    test('get /users/1', async () => {
        await server
        .get('/users/1')
        .expect(OK);
    });

    test('get /users', async () => {
        await server
        .get('/users')
        .expect(OK);
    });

    test('delete /users/1', async () => {
        await server
        .delete('/users/1')
        .expect(NO_CONTENT);
    });

    test('create /users', async () => {
        await server
        .post('/users')
        .send({email, password})
        .expect(CONFLICT);
    });

    test('login after delete /users/1', async () => {
        await server
        .delete('/users/1')
        .expect(NO_CONTENT);

        await server
        .post('/login')
        .send({email, password})
        .expect(BAD_REQUEST);
    });

    test('refresh token', async () => {
        await server
        .post('/token')
        .send({email, refreshToken})
        .expect(NO_CONTENT);

        await server
        .get('/users')
        .expect(OK);
    });

    test('refresh token fail', async () => {
        await server
        .post('/token')
        .send({email: 'hello@gmail.com', refreshToken})
        .expect(UNAUTHORIZED);
    });

    test('reject token', async () => {
        await server
        .delete('/token')
        .send({refreshToken})
        .expect(NO_CONTENT);

        await server
        .get('/users')
        .expect(UNAUTHORIZED);
    });
});