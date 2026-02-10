const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const SCRIPT_FILE = path.join(__dirname, 'crispextended.js');

// Store connected clients for hot reload
const clients = new Set();

// Create HTTP server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve the script
  if (req.url === '/crispextended.js' || req.url === '/') {
    fs.readFile(SCRIPT_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading script file');
        return;
      }

      res.writeHead(200, { 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(data);
    });
  }
  // SSE endpoint for hot reload notifications
  else if (req.url === '/reload-stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    res.write('data: connected\n\n');

    // Add client to set
    clients.add(res);

    // Remove client on disconnect
    req.on('close', () => {
      clients.delete(res);
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// Watch for file changes
fs.watch(SCRIPT_FILE, (eventType) => {
  if (eventType === 'change') {
    console.log(`[${new Date().toLocaleTimeString()}] File changed, notifying ${clients.size} client(s)...`);
    
    // Notify all connected clients
    clients.forEach(client => {
      try {
        client.write('data: reload\n\n');
      } catch (err) {
        clients.delete(client);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Tampermonkey Script Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📄 Script URL: http://localhost:${PORT}/crispextended.js`);
  console.log(`🔄 Hot reload: ENABLED`);
  console.log(`👀 Watching: ${SCRIPT_FILE}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`💡 Update your Tampermonkey script @require to:`);
  console.log(`   @require http://localhost:${PORT}/crispextended.js\n`);
});
