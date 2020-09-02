import {Entity, ManyToOne, PrimaryColumn} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken {
    @PrimaryColumn()
    token!: string;

    @ManyToOne(type => User, user => user.refreshTokens, {nullable: false, onDelete: 'CASCADE'})
    user!: Promise<User>;
}
