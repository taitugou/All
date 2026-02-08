const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 81;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.xml': 'application/xml',
};

const server = http.createServer((req, res) => {
    // 解析 URL，去掉查询字符串和哈希
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;
    
    // 默认指向 index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'no-agent';
    console.log(`[${new Date().toLocaleTimeString()}] Request from ${clientIp}: ${req.url} [${userAgent}]`);

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.warn(`[${new Date().toLocaleTimeString()}] 404 Not Found: ${filePath}`);
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                console.error(`[${new Date().toLocaleTimeString()}] 500 Server Error: ${error.code}`);
                res.writeHead(500);
                res.end('500 Internal Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '::', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Server is running!`);
    console.log(`- Local:    http://localhost:${PORT}/`);
    
    // 获取本机所有网卡的 IP 地址
    const interfaces = os.networkInterfaces();
    console.log(`- Network access:`);
    for (const devName in interfaces) {
        interfaces[devName].forEach((details) => {
            if (details.family === 'IPv4' || details.family === 'IPv6') {
                const addr = details.family === 'IPv6' ? `[${details.address}]` : details.address;
                console.log(`  > http://${addr}:${PORT}/`);
            }
        });
    }
    console.log('\nPress Ctrl+C to stop.');
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`Error: Port ${PORT} requires elevated privileges (Admin).`);
    } else if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use.`);
    } else {
        console.error('Server error:', err);
    }
});
