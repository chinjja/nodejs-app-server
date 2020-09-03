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
    .post('/register')
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
    .post('/register')
    .send({email, password})
    .expect(CREATED);

    await server
    .post('/register')
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
        expect(token).not.toBeUndefined();
        expect(refreshToken).not.toBeUndefined();
    });

    test('get /users/1', async () => {
        await server
        .get('/users/1')
        .auth(token, {type: 'bearer'})
        .expect(OK);
    });

    test('get /users', async () => {
        await server
        .get('/users')
        .auth(token, {type: 'bearer'})
        .expect(OK);
    });

    test('delete /users/1', async () => {
        await server
        .delete('/users/1')
        .auth(token, {type: 'bearer'})
        .expect(NO_CONTENT);
    });

    test('create /register', async () => {
        await server
        .post('/register')
        .send({email, password})
        .expect(CONFLICT);
    });

    test('login after delete /users/1', async () => {
        await server
        .delete('/users/1')
        .auth(token, {type: 'bearer'})
        .expect(NO_CONTENT);

        await server
        .post('/login')
        .send({email, password})
        .expect(BAD_REQUEST);
    });

    test('unauth refresh token', async () => {
        await server
        .post('/jwt/refresh')
        .send({token, refreshToken})
        .expect(OK);

        await server
        .get('/users')
        .auth(token, {type: 'bearer'})
        .expect(OK);
    });

    test('refresh token', async () => {
        const res = await server
        .post('/jwt/refresh')
        .send({token, refreshToken})
        .expect(OK);

        await server
        .get('/users')
        .auth(res.body.token, {type: 'bearer'})
        .expect(OK);
    });

    test('refresh token after rejection', async () => {
        await server
        .delete('/jwt/refresh')
        .send({refreshToken})
        .expect(NO_CONTENT);

        await server
        .post('/jwt/refresh')
        .send({token, refreshToken})
        .expect(UNAUTHORIZED);
    });

    test('refresh token fail', async () => {
        await server
        .post('/jwt/refresh')
        .send({token: 'hello@gmail.com', refreshToken})
        .expect(UNAUTHORIZED);
    });

    test('reject refresh token and using previous token for authorization', async () => {
        await server
        .delete('/jwt/refresh')
        .send({refreshToken})
        .expect(NO_CONTENT);

        await server
        .get('/users')
        .auth(token, {type: 'bearer'})
        .expect(OK);
    });
});