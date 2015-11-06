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

// Sample scraper for creating large exploration procedurally.
// This script scrapes Wikipedia for world cities (capitals of the countries)
// and retrieves their name and coordinates. It can be ran as:
//
// $ node scripts/wikicities.js > cities.tsv
//
// Currently it fails to parse many city pages (about half of them) and we need
// to remove a duplicate (Jerusalem), so a clean data can be created as:
//
// $ node scripts/wikicities.js | grep -v FAILED | sort | uniq > cities.tsv
//
// The output is a tab separated vector where the columns are the city ID
// (url page path), city name, and the coordinate. The coordinate is a pair of
// numbers separated by comma, e.g.
//
// Helsinki<tab>Helsinki<tab>60.17083,24.93750

var _http = require('http');
var _fs = require('fs');
var _zlib = require('zlib');

var host = 'http://en.wikipedia.org';

var forPage = function(path, handler) {
    console.error('downloading: ' + path);
    try {
        _http.request(
            host + path,
            function(res) {
                var stream = res.headers['content-encoding'] == 'gzip' ?
                    res.pipe(_zlib.createGunzip()) : res;
                var data = '';
                stream.setEncoding('utf8');
                stream.on('data', function (chunk) { data += chunk; });
                stream.on('error', function (err) {
                    console.error('stream err: ' + path);
                });
                stream.on('end', function() {
                    handler(data);
                });
            }).end();
    } catch (e) {
      console.error('err on: ' + path);
      console.error(e);
    }
};

var forCity = function(path, country) {
    forPage(path, function(page) {
        // Looking for the title tag, e.g.
        // <title>CityName - Wikipedia, the free encyclopedia</title>
        var title_re = /\<\s*title\s*\>\s*([^\-]*)/.exec(page)
        var title = title_re ? title_re[1].trim() : '[FAILED]';

        // Looknig for an element with "geo" class, e.g.
        // <span class="geo">12.345; 98.765</span>
        var coords_re = /class\=\"geo\"[^\>]*\>\s*([\d\.]+)[\;\s]+([\d\.]+)/.exec(page)
        var coords = coords_re ? coords_re[1] + ',' + coords_re[2] : '[FAILED]';

        var row = [path.replace('/wiki/', ''), title];
        if (country !== undefined) {
          row.push(country);
        }
        row.push(coords);
        console.log(row.join('\t'));
    });
};
var forCities = function() {
    _fs.readFileSync('/dev/stdin').toString().split('\n').forEach(function(line) {
        var cols = line.split('\t');
        if (cols.length != 2) {
          return;
        }
        //forCity(cols[0], cols[1]);
        forCity(cols[0]);
    });
};
//forCities();

var forCityList = function(path) {
    forPage(path, function(page) {
        // Looking for the title tag, e.g.
        // <title>List of cities in CountryName - Wikipedia, the free encyclopedia</title>
        var country_re = /\<\s*title\s*\>List of cities in ([^\-]*)/.exec(page)
        var country = country_re ? country_re[1].trim() : '[FAILED]';

        // Looking for table entries of the form:
        // <td><a href="/wiki/CityName" title="CityName">CityName</a></td>
        var re = /\<td\><a\s+href\=\"([^\"]+)\"\s+title\=/g;
        var match;
        var count = 0;
        while (match = re.exec(page)) {
            //forCity(match[1], country);
            console.log(match[1] + '\t' + country);
            count++;
        }
        console.log('[COUNTRY] ' + path + '(' + country + '): ' + (count ? count : '[FAILED]'));
    });
};

var forCountryList = function(path) {
  forPage(path, function(page) {
      // Looking for elements of the form:
      // <a href="/wiki/List_of_cities_in_CountryName" title="List of cities in CountryName">
      var re = /<a\s+href\=\"([^\"]+)\"\s+title\=\"List of cities in /g;
      var match;
      while (match = re.exec(page)) {
          //forCityList(match[1]);
          console.log(match[1]);
      }
  });
};
//forCountryList('/wiki/Lists_of_cities_by_country');

var forCapitalList = function(path) {
    forPage(path, function(page) {
        // Looking for table rows first.
        page.split('<tr>').forEach(function(section) {
            // Looking for table entries of the form:
            // <td><a href="/wiki/CityName" title="CityName">
            var re = /<td><a\s+href="([^"]+)"\s+title="([^"]+)">/.exec(section);
            if (!re) {
              return;
            }
            forCity(re[1]);
            //console.log(re[1] + '\t' + re[2]);
        });
    });
};
forCapitalList('/wiki/List_of_national_capitals_in_alphabetical_order');
