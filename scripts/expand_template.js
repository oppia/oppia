// Run with node.js.
// Need to have ejs module installed.
// E.g.
// node scripts/expand_template.js scripts/data/cities_template.yaml \
// < cities.csv \
// > data/explorations/cities.yaml

var _ejs = require('ejs');
var _fs = require('fs');

if (process.argv.length != 3) {
    console.error('need one argument for the template file name.');
    process.exit(-1);
}
var template_filename = process.argv[2];

var cities = [];
_fs.readFileSync('/dev/stdin').toString().split('\n').forEach(function(line) {
    if (!line.trim()) { return; }
    var items = line.split(',');
    if (items.length != 4) {
        console.error('malformed line: ' + line);
        return;
    }
    cities.push({
        id: items[0].trim().replace('_', ''),
        name: items[1].trim(),
        lat: Number(items[2]),
        lng: Number(items[3])
    });
});

console.log(_ejs.render(
        _fs.readFileSync(template_filename).toString(), {cities: cities}));
