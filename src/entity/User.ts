import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Matches, MinLength} from 'class-validator';
import { Post, RefreshToken } from ".";

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

    @OneToMany(type => RefreshToken, token => token.user)
    refreshTokens!: Promise<RefreshToken[]>
}
