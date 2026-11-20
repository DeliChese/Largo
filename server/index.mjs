import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { createSpeechRouter } from './speech.mjs';

const app = express();
app.disable('x-powered-by');
app.use('/api/speech', createSpeechRouter(process.env));
app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url))));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => process.stdout.write('Largo đang chạy tại http://' + host + ':' + port + '/\n'));
