import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Matches, MinLength} from 'class-validator';
import { Post } from "./Post";

@Entity("users")
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        unique: true,
        collation: 'NOCASE',
    })
    @Matches(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
    email!: string;

    @Column()
    @MinLength(8)
    password!: string;

    @Column({
        nullable: true
    })
    name?: string;

    @OneToMany(type => Post, post => post.user)
    posts!: Promise<Post[]>;
}
