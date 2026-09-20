// Corre api/stripe-webhook.ts localmente, sem Vercel.
//   node --env-file=.env scripts/webhook-local.mjs
// Aponta o `stripe listen` para  http://localhost:3001/api/stripe-webhook
import { createServer } from 'node:http';
import handler from '../api/stripe-webhook.ts';

const PORT = process.env.WEBHOOK_PORT || 3001;

createServer(async (nreq, nres) => {
  const chunks = [];
  for await (const c of nreq) chunks.push(c);
  const req = new Request(`http://localhost:${PORT}${nreq.url}`, {
    method: nreq.method,
    headers: nreq.headers,
    body: ['GET', 'HEAD'].includes(nreq.method) ? undefined : Buffer.concat(chunks),
  });
  try {
    const res = await handler(req);
    nres.writeHead(res.status, Object.fromEntries(res.headers));
    nres.end(Buffer.from(await res.arrayBuffer()));
  } catch (err) {
    console.error(err);
    nres.writeHead(500);
    nres.end(String(err));
  }
}).listen(PORT, () => console.log(`webhook local → http://localhost:${PORT}/api/stripe-webhook`));
