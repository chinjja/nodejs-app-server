import server from './server';
import './database';
server.listen(process.env.PORT || 80);