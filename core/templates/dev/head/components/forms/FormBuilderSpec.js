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

/**
 * @fileoverview Tests for the form builders.
 */

describe('HTML to text', function() {
  beforeEach(module('oppia'));

  var htmlUnicodeHtmlPairings = [
    ['abc', 'abc', 'abc'],
    ['&lt;a&copy;&deg;', '<a©°', '&lt;a&#169;&#176;'],
    ['<b>a</b>', 'a', 'a'],
    ['<br>a', 'a', 'a'],
    ['<br/>a', 'a', 'a'],
    ['<br></br>a', 'a', 'a'],
    ['abc  a', 'abc  a', 'abc  a']
  ];

  it('should convert HTML to and from raw text correctly', inject(
    function($filter) {
      htmlUnicodeHtmlPairings.forEach(function(pairing) {
        expect($filter('convertHtmlToUnicode')(pairing[0])).toEqual(pairing[1]);
        expect($filter('convertUnicodeToHtml')(pairing[1])).toEqual(pairing[2]);
      });
    }
  ));

  var invalidUnicodeStrings = [
    '{}',
    '}}abc{{',
    '\\{{a}}',
    '{{a\\}}',
    '{{a}\\}'
  ];

  it('should detect invalid unicode strings', inject(function($filter) {
    invalidUnicodeStrings.forEach(function(s) {
      var fn = function() {
        return $filter('convertUnicodeWithParamsToHtml')(s);
      };
      expect(fn).toThrow();
    });
  }));

  var validUnicodeStrings = [
    '{{}}',
    '{{abc}}',
    '\\\\{{abc}}',
    '\\{{{abc}}'
  ];

  it('should detect valid unicode strings', inject(function($filter) {
    var results = [
    '<oppia-parameter></oppia-parameter>',
    '<oppia-parameter>abc</oppia-parameter>',
    '\\<oppia-parameter>abc</oppia-parameter>',
    '{<oppia-parameter>abc</oppia-parameter>',
    ];
    validUnicodeStrings.forEach(function(s, i) {
      var fn = (function() {
        return $filter('convertUnicodeWithParamsToHtml')(s);
      })();
      expect(fn).toBe(results[i]);
    });
  }));
});

describe('Normalizer tests', function() {
  var filterNames = [
    'isFloat',
    'isAtLeast',
    'isAtMost',
    'isNonempty',
    'isInteger'
  ];

  beforeEach(module('oppia'));

  it('should have the relevant filters', inject(function($filter) {
    angular.forEach(filterNames, function(filterName) {
      expect($filter(filterName)).not.toEqual(null);
    });
  }));

  it('should validate floats correctly', inject(function($filter) {
    var filter = $filter('isFloat');
    expect(filter('1.23')).toEqual(1.23);
    expect(filter('-1.23')).toEqual(-1.23);
    expect(filter('0')).toEqual(0);
    expect(filter('-1')).toEqual(-1);
    expect(filter('-1.0')).toEqual(-1);
    expect(filter('1,5')).toEqual(1.5);
    expect(filter('1%')).toEqual(0.01);
    expect(filter('1.5%')).toEqual(0.015);
    expect(filter('-5%')).toEqual(-0.05);
    expect(filter('.35')).toEqual(0.35);
    expect(filter(',3')).toEqual(0.3);
    expect(filter('.3%')).toEqual(0.003);
    expect(filter('2,5%')).toEqual(0.025);
    expect(filter('3.2% ')).toEqual(0.032);
    expect(filter(' 3.2% ')).toEqual(0.032);
    expect(filter('0.')).toEqual(0);

    expect(filter('3%%')).toBeUndefined();
    expect(filter('-')).toBeUndefined();
    expect(filter('.')).toBeUndefined();
    expect(filter(',')).toBeUndefined();
    expect(filter('5%,')).toBeUndefined();
    expect(filter('')).toBeUndefined();
    expect(filter('1.23a')).toBeUndefined();
    expect(filter('abc')).toBeUndefined();
    expect(filter('2+3')).toBeUndefined();
    expect(filter('--1.23')).toBeUndefined();
    expect(filter('=1.23')).toBeUndefined();
  }));

  it('should impose minimum bounds', inject(function($filter) {
    var filter = $filter('isAtLeast');
    var args = {
      minValue: -2.0
    };
    expect(filter(1.23, args)).toBe(true);
    expect(filter(-1.23, args)).toBe(true);
    expect(filter(-1.99, args)).toBe(true);
    expect(filter(-2, args)).toBe(true);
    expect(filter(-2.01, args)).toBe(false);
    expect(filter(-3, args)).toBe(false);
  }));

  it('should impose maximum bounds', inject(function($filter) {
    var filter = $filter('isAtMost');
    var args = {
      maxValue: -2.0
    };
    expect(filter(-2, args)).toBe(true);
    expect(filter(-2.01, args)).toBe(true);
    expect(filter(-3, args)).toBe(true);
    expect(filter(1.23, args)).toBe(false);
    expect(filter(-1.23, args)).toBe(false);
    expect(filter(-1.99, args)).toBe(false);
  }));

  it('should validate non-emptiness', inject(function($filter) {
    var filter = $filter('isNonempty');
    expect(filter('a')).toBe(true);
    expect(filter('')).toBe(false);
  }));

  it('should validate integers', inject(function($filter) {
    var filter = $filter('isInteger');
    expect(filter('3')).toBe(true);
    expect(filter('-3')).toBe(true);
    expect(filter('3.0')).toBe(true);
    expect(filter('3.5')).toBe(false);
  }));
});

describe('RTE helper service', function() {
  var _IMAGE_URL = '/rich_text_components/Some/Some.png';
  var _INTERPOLATED_IMAGE_URL = '/extensions' + _IMAGE_URL;
  var rhs;

  beforeEach(module('oppia'));

  beforeEach(function() {
    module(function($provide) {
      $provide.constant('RTE_COMPONENT_SPECS', [{
        frontend_id: 'image',
        backend_id: 'Image',
        tooltip: 'Insert image',
        icon_data_url: _IMAGE_URL,
        preview_url_template_dev: _IMAGE_URL
      }]);
    });
  });

  beforeEach(inject(function($injector) {
    rhs = $injector.get('RteHelperService');
  }));

  it('should convert correctly between HTML and RTE', function() {
    var testData = [[
      '<div></div>', '<div></div>'
    ], [
      '<div>abc</div>', '<div>abc</div>'
    ], [
      '<div>abc<span>def</span></div><b>ghi</b>',
      '<div>abc<span>def</span></div><b>ghi</b>'
    ], [
      '<oppia-noninteractive-image></oppia-noninteractive-image>',
      '<img src="' + _INTERPOLATED_IMAGE_URL + '" ' +
           'class="oppia-noninteractive-image">'
    ], [
      '<oppia-noninteractive-image ' +
        'image_id-with-value="&amp;quot;T&amp;quot;">' +
      '</oppia-noninteractive-image>',
      '<img src="' + _INTERPOLATED_IMAGE_URL + '" ' +
           'class="oppia-noninteractive-image" ' +
           'image_id-with-value="&amp;quot;T&amp;quot;">'
    ]];

    for (var i = 0; i < testData.length; i++) {
      expect(rhs.convertHtmlToRte(testData[i][0]))
        .toEqual(testData[i][1]);
      expect(rhs.convertRteToHtml(testData[i][1]))
        .toEqual(testData[i][0]);
    }
  });
});
