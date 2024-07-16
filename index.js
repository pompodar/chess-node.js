const fs = require('fs');
const http = require('http');
const url = require('url');
const path = require('path');
const multiparty = require('multiparty');

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

  if (pathname === '/api/pgn-files' && req.method === 'GET') {
    // API to list PGN files
    const { search = '', page = 1, limit = 3 } = query;
    const offset = (page - 1) * limit;

    fs.readdir(PGN_DIR, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read directory' }));
        return;
      }

      const pgnFiles = files
        .filter(file => path.extname(file) === '.pgn')
        .map(file => ({
          fileName: file,
          friendlyName: convertFileNameToFriendlyName(file)
        }))
        .filter(file => file.friendlyName.toLowerCase().includes(search.toLowerCase()));

      const paginatedFiles = pgnFiles.slice(offset, offset + limit);
      const totalPages = Math.ceil(pgnFiles.length / limit);

      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify({ files: paginatedFiles, totalPages, currentPage: page }));
    });

  } else if (pathname.startsWith('/api/pgn-files/')) {
    // API to get a PGN file
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

  } else if (pathname === '/api/pgn-files-save') {
    // API to save a PGN file
    const form = new multiparty.Form();

    form.parse(req, (err, fields, files) => {
      if (err) {
        res.writeHead(400, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid form data' }));
        return;
      }

      const file = files.file[0];
      const filePath = path.join(PGN_DIR, file.originalFilename);

      fs.copyFile(file.path, filePath, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to save file' }));
          return;
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ message: 'File uploaded successfully' }));
      });
    });
  } else {
    // Not found
    res.writeHead(404, {
      'Content-type': 'text/html',
      'my-own-header': 'hello-world'
    });
    res.end('<h1>This is an API for chess</h1>');
  }
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});
