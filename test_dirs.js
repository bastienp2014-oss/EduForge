const fs = require('fs');
console.log('workspace:', fs.readdirSync('/workspace'));
console.log('applet:', fs.readdirSync('/app/applet'));
