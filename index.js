import { httpServerHandler } from 'cloudflare:node';
import app from './app.js';

const PORT = 8080;
const expressApp = app.default || app;
expressApp.listen(PORT);

export default httpServerHandler({ port: PORT });
