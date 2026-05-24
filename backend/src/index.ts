import { createServer } from 'http';
import { createApp } from './app.js';
import { config } from './config.js';
import { initSocket } from './socket/index.js';

const app = createApp();
const server = createServer(app);

initSocket(server);

server.listen(config.port, () => {
  console.log(`LightTickets API running on port ${config.port}`);
});
