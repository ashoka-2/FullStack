const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/features/auth/pages/Settings.jsx');
let content = fs.readFileSync(filePath, 'utf8');
// Keep only up to and including the first "export default Settings;"
const marker = 'export default Settings;';
const idx = content.indexOf(marker);
if (idx !== -1) {
    content = content.slice(0, idx + marker.length) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned Settings.jsx. Lines:', content.split('\n').length);
} else {
    console.log('Marker not found');
}
