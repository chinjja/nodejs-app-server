import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Matches, MinLength} from 'class-validator';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
        collation: 'NOCASE',
    })
    @Matches(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
    email: string;

    @Column()
    @MinLength(8)
    password: string;

    @Column({
        nullable: true
    })
    name: string;
}
