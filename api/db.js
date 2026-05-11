export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) return res.status(503).json({ error: 'KV_NOT_CONFIGURED' });

  const headers = { Authorization: `Bearer ${token}` };

  async function get(key) {
    const r = await fetch(`${url}/get/${key}`, { headers });
    const d = await r.json();
    return d.result ? JSON.parse(d.result) : null;
  }

  async function set(key, value) {
    await fetch(`${url}/set/${key}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.stringify(value))
    });
  }

  try {
    if (req.method === 'GET') {
      const [stockData, movData] = await Promise.all([get('stockvet:stock'), get('stockvet:mov')]);
      return res.status(200).json({ stockData, movData });
    }
    if (req.method === 'POST') {
      const { payload } = req.body;
      await Promise.all([set('stockvet:stock', payload.stockData), set('stockvet:mov', payload.movData)]);
      return res.status(200).json({ ok: true });
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
