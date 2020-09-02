import {Entity, ManyToOne, PrimaryColumn, Column, Unique} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
@Unique(['user', 'exp'])
export class RefreshToken {
    @PrimaryColumn()
    token!: string;

    @Column()
    exp!: Date;

    @ManyToOne(type => User, user => user.refreshTokens, {nullable: false, onDelete: 'CASCADE'})
    user!: Promise<User>;
}
