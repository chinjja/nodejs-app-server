import {createConnection, getConnection} from 'typeorm';
import { User, Post, RefreshToken } from '../src/entity';

const connection = {
  async create() {
    await createConnection({
      type: 'sqlite',
      synchronize: true,
      database: ':memory:',
      entities: [User, Post, RefreshToken],
    });
  },

  async close(){
    await getConnection().close(); 
  },

  async clear(){
    const connection = getConnection();
    const entities = connection.entityMetadatas;

    entities.forEach(async (entity) => {
      const repository = connection.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    });
  },
};
export default connection;