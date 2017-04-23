var fs = require('fs');
var file = process.argv[2];
fs.readFile(file, 'binary', function(err, data) {
   console.log(new Buffer(data, 'binary').toString('base64'));
});