import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { createSpeechRouter } from './speech.mjs';
import { createSentenceAssessmentRouter } from './sentenceAssessment.mjs';
import { createWordChainRouter } from './wordChain.mjs';

const app = express();
app.disable('x-powered-by');
app.use('/api/speech', createSpeechRouter(process.env));
app.use('/api/ai/word-chain', createWordChainRouter(process.env));
app.use('/api/ai', createSentenceAssessmentRouter(process.env));
app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url))));

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => process.stdout.write('Largo đang chạy tại http://' + host + ':' + port + '/\n'));
