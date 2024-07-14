const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');

const PGN_DIR = path.join(__dirname, 'pgn-files');

const convertFileNameToFriendlyName = (fileName) => {
  const [white, black, year] = fileName.replace('.pgn', '').split('_');
  return `${white.charAt(0).toUpperCase() + white.slice(1)} vs ${black.charAt(0).toUpperCase() + black.slice(1)} - ${year}`;
};

const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);

  // Set CORS headers for all routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API to get all data
  if (pathname === '/') {
    res.writeHead(200, {
      'Content-type': 'application/json'
    });
    res.end(data);

    // API to list PGN files
  } else if (pathname === '/api/pgn-files') {
    fs.readdir(PGN_DIR, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read directory' }));
        return;
      }

      const pgnFiles = files.filter(file => path.extname(file) === '.pgn').map(file => ({
        fileName: file,
        friendlyName: convertFileNameToFriendlyName(file)
      }));
      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify({ files: pgnFiles }));
    });

    // API to serve a specific PGN file
  } else if (pathname.startsWith('/api/pgn-files/')) {
    const fileName = pathname.split('/').pop();
    const filePath = path.join(PGN_DIR, fileName);

    fs.readFile(filePath, 'utf-8', (err, fileContent) => {
      if (err) {
        res.writeHead(404, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }

      res.writeHead(200, { 'Content-type': 'text/plain' });
      res.end(fileContent);
    });

    // Not found
  } else {
    res.writeHead(404, {
      'Content-type': 'text/html',
      'my-own-header': 'hello-world'
    });
    res.end('<h1>Page not found!</h1>');
  }
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});
