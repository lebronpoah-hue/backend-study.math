import http from 'node:http';
import { httpServerHandler } from 'cloudflare:node';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);
    const targetUrl = reqUrl.searchParams.get('url');

    if (!targetUrl) {
      res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
      return;
    }

    // Fetch the target website
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const body = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html';

    // Strip headers that block iframe/cross-origin rendering
    res.writeHead(response.status, {
      ...CORS_HEADERS,
      'Content-Type': contentType,
    });
    res.end(body);

  } catch (err: any) {
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Proxy fetch failed' }));
  }
});

server.listen(8080);
export default httpServerHandler({ port: 8080 });
