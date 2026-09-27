import { send } from '../lib/http.js';

export default function handler(req, res) {
  send(res, 200, {
    ok: true,
    assemblyai: Boolean(process.env.ASSEMBLYAI_API_KEY),
    llm: Boolean(process.env.GEMINI_API_KEY),
  });
}
