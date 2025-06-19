const fs = require('fs'); const content = fs.readFileSync('src/app/messaging/page.tsx', 'utf8'); console.log('File loaded successfully', content.length, 'characters');
