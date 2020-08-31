import "reflect-metadata";
import {getConnection} from "typeorm";
import {User} from "../../src/entity/User";
import {validate} from 'class-validator';
import connection from '../connection';

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

it('should be same to values of properties I expected', async () => {
    const user = new User();
    user.email = 'chinjja@gmail.com';
    user.password = '12345678';
    user.name = 'chinjja';

    const error = await validate(user);
    expect(error).toStrictEqual([]);

    expect(user.email).toEqual('chinjja@gmail.com');
    expect(user.password).toEqual('12345678');
    expect(user.name).toEqual('chinjja');
});

it('should be same between two user object', () => {
    const user1 = new User();
    user1.email = 'chinjja@gmail.com';
    user1.password = '12345678';

    const user2 = new User();
    user2.email = 'chinjja@gmail.com';
    user2.password = '12345678';

    expect(user2).toStrictEqual(user1);

    user2.password = 'password';
    expect(user2).not.toStrictEqual(user1);
});

it('should be not same between two user object', () => {
    const user1 = new User();
    user1.email = 'chinjja@gmail.com';
    user1.password = '12345678';

    const user2 = new User();
    user2.email = 'chinjja@gmail.com';
    user2.password = 'password';
    
    expect(user2).not.toStrictEqual(user1);
});

it('password must be longer than or equal to 8 characters', async () => {
    const user = new User();
    user.email = 'chinjja@gmail.com';
    user.password = '12345678';

    const error = await validate(user);
    expect(error).toStrictEqual([]);
});

it('password are shortest than to 8 characters throw error', async () => {
    const user = new User();
    user.email = 'chinjja@gmail.com';
    user.password = '1234567';

    const error = await validate(user);
    expect(error).not.toStrictEqual([]);
});

it('should be same', async () => {
    const manager = getConnection().manager;

    const user = new User();
    user.email = 'chinjja@gmail.com';
    user.password = '12345678';

    const savedUser = await manager.save(user);
    expect(savedUser).toStrictEqual(user);
});

it('should be same from manager', async () => {
    const manager = getConnection().manager;
    
    expect(await manager.count(User)).toEqual(0);

    const user = manager.create(User, {
        email: 'chinjja@gmail.com',
        password: '12345678'
    });
    await manager.save(user);
    expect(await manager.count(User)).toEqual(1);
});