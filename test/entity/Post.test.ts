import "reflect-metadata";
import {getConnection} from "typeorm";
import {User, Post} from "../../src/entity";
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

test("should save new post", async () => {
    const manager = getConnection().manager;

    const user = new User();
    user.email = 'chinjja@gmail.com';
    user.password = '12345678';
    await manager.save(user);
    
    const createdAt = new Date();
    const updatedAt = new Date();

    const post = new Post();
    post.title = 'post1';
    post.contents = 'contents1';
    post.user = Promise.resolve(user);
    post.createdAt = createdAt;
    post.updatedAt = updatedAt;
    const savedPost = await manager.save(post);

    expect(savedPost.id).toEqual(1);
    expect(savedPost.title).toEqual('post1');
    expect(savedPost.contents).toEqual('contents1');
    expect(savedPost.createdAt).toEqual(createdAt);
    expect(savedPost.updatedAt).toEqual(updatedAt);
    expect(await savedPost.user).toEqual(user);
});

it("shouldn't save new post if user is null", async () => {
    const manager = getConnection().manager;

    const post = new Post();
    post.title = 'post1';
    post.contents = 'contents1';
    post.createdAt = new Date();
    post.updatedAt = new Date();
    await expect(manager.save(post)).rejects.toThrow();
});

describe("after creating posts", () => {
    beforeEach(async () => {
        const manager = getConnection().manager;
        const user = new User();
        user.email = 'chinjja@gmail.com';
        user.password = '12345678';
        await manager.save(user);
    
        const size = 10;
        for(let i = 1; i <= size; i++) {
            const post = new Post();
            post.title = `post${i}`;
            post.contents = `contents${i}`;
            post.createdAt = new Date();
            post.updatedAt = new Date();
            post.user = Promise.resolve(user);
            await manager.save(post);
        }
    });
    
    it("should be 10", async () => {
        const manager = getConnection().manager;
        expect(await manager.count(Post)).toEqual(10);
        expect(await manager.count(Post, {where: {user: {id: 1}}})).toEqual(10);
        
        const user = await manager.findOneOrFail(User, 1);
        await expect(user.posts).resolves.toHaveLength(10);
    });

    it("should be 9 after deleting a post", async () => {
        const manager = getConnection().manager;
        await manager.delete(Post, {id: 1});
        expect(await manager.count(Post)).toEqual(9);
        
        const user = await manager.findOneOrFail(User, 1);
        await expect(user.posts).resolves.toHaveLength(9);
    });
    
    it("should be 0 after deleting post all", async () => {
        const manager = getConnection().manager;
        await manager.delete(Post, {});
        expect(await manager.count(Post)).toEqual(0);
        
        const user = await manager.findOneOrFail(User, 1);
        await expect(user.posts).resolves.toHaveLength(0);
    });
});