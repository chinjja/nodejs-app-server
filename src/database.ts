import { createConnection } from 'typeorm';
import path from 'path';

const synchronize = async () => {
    const env = process.env.NODE_ENV || 'dev';
    if(env === 'dev') {
        await createConnection({
            type: 'sqlite',
            synchronize: true,
            database: path.resolve(__dirname, '../coverage/database.sqlite'),
            entities: [path.resolve(__dirname, 'entity/*')],
            logging: true,
        });
    } else if(env === 'test') {
        await createConnection({
            type: 'sqlite',
            synchronize: true,
            database: ':memory:',
            entities: [path.resolve(__dirname, 'entity/*')],
            logging: false,
        });
    } else {
        await createConnection();
    }
}

synchronize();