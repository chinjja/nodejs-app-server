import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { User } from "./User";

@Entity("posts")
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    contents!: string;

    @Column()
    createdAt!: Date;

    @Column()
    updatedAt!: Date;

    @ManyToOne(type => User, user => user.posts, {nullable: false, onDelete: 'CASCADE'})
    user!: Promise<User>;
}
