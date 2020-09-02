import {Entity, ManyToOne, PrimaryColumn, Unique} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
@Unique(['token', 'user'])
export class RefreshToken {
    @PrimaryColumn()
    token!: string;

    @ManyToOne(type => User, user => user.refreshTokens, {nullable: false, onDelete: 'CASCADE'})
    user!: Promise<User>;
}
