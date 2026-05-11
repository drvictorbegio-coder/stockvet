const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const d = await r.json();
  return d.result ? JSON.parse(d.result) : null;
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV não configurado');
  await fetch(`${KV_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: JSON.stringify(value) })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ error: 'KV_NOT_CONFIGURED' });
  }

  try {
    if (req.method === 'GET') {
      const [stockData, movData] = await Promise.all([
        kvGet('stockvet:data'),
        kvGet('stockvet:movimentos')
      ]);
      return res.status(200).json({ stockData, movData });
    }
    if (req.method === 'POST') {
      const { payload } = req.body;
      await Promise.all([
        kvSet('stockvet:data', payload.stockData),
        kvSet('stockvet:movimentos', payload.movData)
      ]);
      return res.status(200).json({ ok: true });
    }
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
