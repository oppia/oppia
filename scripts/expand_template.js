// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Produces world city exploration from a template yaml file and a tab separated
// vector data file.
// See scripts/wikicities.js for an example of producing the input data and the
// description of the data format.
//
// This script runs on node.js and requires ejs module. Node.js is installed by
// Oppia's installation. The ejs module can be installed as:
//
// $ ../oppia_tools/node-0.10.1/bin/npm install ejs
//
// This script can then be run as:
//
// $ node scripts/expand_template.js scripts/data/cities_template.yaml < cities.tsv > data/explorations/cities.yaml

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
    var items = line.split('\t');
    if (items.length != 3) {
        console.error('malformed line: ' + line);
        return;
    }
    var coords = items[2].split(',');
    cities.push({
        id: items[0].trim().replace(/[^a-zA-Z0-9]/g, ''),
        name: items[1].trim(),
        lat: Number(coords[0]),
        lng: Number(coords[1])
    });
});

console.log(_ejs.render(
        _fs.readFileSync(template_filename).toString(), {cities: cities}));
