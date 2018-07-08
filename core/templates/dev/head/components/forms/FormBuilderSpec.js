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

  it('should correctly sanitize HTML for the RTE', inject(function($filter) {
    var RAW_TEXT = (
      '<span style="color: rgb(85, 85, 85); ' +
      'font-family: Roboto, Arial, sans-serif; ' +
      'font-size: 16px; font-style: normal; ' +
      'font-variant: normal; font-weight: normal; ' +
      'letter-spacing: normal; line-height: 29.5360012054443px; ' +
      'orphans: auto; text-align: left; text-indent: 0px; ' +
      'text-transform: none; white-space: normal; widows: 1; ' +
      'word-spacing: 0px; -webkit-text-stroke-width: 0px; ' +
      'display: inline !important; float: none; ' +
      'background-color: rgb(255, 255, 255);">' +
      'plain text</span>');
    var PROCESSED_TEXT = '<span>plain text</span>';
    var RAW_BOLD_TEXT = (
      '<b style="box-sizing: border-box; font-weight: bold; ' +
      'color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; ' +
      'font-size: 16px; font-style: normal; font-variant: normal; ' +
      'letter-spacing: normal; line-height: 29.5360012054443px; ' +
      'orphans: auto; text-align: left; text-indent: 0px; ' +
      'text-transform: none; white-space: normal; widows: 1; ' +
      'word-spacing: 0px; -webkit-text-stroke-width: 0px; ' +
      'background-color: rgb(255, 255, 255);">bolded text</b>');
    var PROCESSED_BOLD_TEXT = '<b>bolded text</b>';
    var RAW_ITALIC_TEXT = (
      '<i style="box-sizing: border-box; color: rgb(85, 85, 85); ' +
      'font-family: Roboto, Arial, sans-serif; font-size: 16px; ' +
      'font-variant: normal; font-weight: normal; letter-spacing: normal; ' +
      'line-height: 29.5360012054443px; orphans: auto; text-align: left; ' +
      'text-indent: 0px; text-transform: none; white-space: normal; ' +
      'widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; ' +
      'background-color: rgb(255, 255, 255);">italicized text</i>');
    var PROCESSED_ITALIC_TEXT = '<i>italicized text</i>';

    // Preserve allowed tags, but strip unwanted attributes.
    expect($filter('sanitizeHtmlForRte')('')).toEqual('');
    expect($filter('sanitizeHtmlForRte')('test')).toEqual('test');
    expect($filter('sanitizeHtmlForRte')('<p>hello</p>')).toEqual(
      '<p>hello</p>');
    expect($filter('sanitizeHtmlForRte')(RAW_TEXT)).toEqual(PROCESSED_TEXT);
    expect($filter('sanitizeHtmlForRte')(RAW_BOLD_TEXT)).toEqual(
      PROCESSED_BOLD_TEXT);
    expect($filter('sanitizeHtmlForRte')(RAW_ITALIC_TEXT))
      .toEqual(PROCESSED_ITALIC_TEXT);
    expect($filter('sanitizeHtmlForRte')(
      RAW_TEXT + RAW_BOLD_TEXT + RAW_ITALIC_TEXT
    )).toEqual(PROCESSED_TEXT + PROCESSED_BOLD_TEXT + PROCESSED_ITALIC_TEXT);

    expect($filter('sanitizeHtmlForRte')('a<code>b</code>'))
      .toEqual('a<code>b</code>');
    expect($filter('sanitizeHtmlForRte')(
      'hello <a href="http://www.abc.com">a link</a> goodbye'
    )).toEqual('hello <a href="http://www.abc.com">a link</a> goodbye');
    expect($filter('sanitizeHtmlForRte')(
      '<table><tr><td>inside</td></tr></table>outside'
    )).toEqual('<table><tbody><tr><td>inside</td></tr></tbody></table>outside');

    // Remove non-allowed tags.
    expect($filter('sanitizeHtmlForRte')('good <script>bad</script> good'))
      .toEqual('good  good');
    expect($filter('sanitizeHtmlForRte')('<iframe>inner</iframe>good'))
      .toEqual('innergood');
    expect($filter('sanitizeHtmlForRte')('<embed>inner</embed>good'))
      .toEqual('innergood');

    // Remove non-allowed attributes.
    expect($filter('sanitizeHtmlForRte')(
      'good <nonsense-tag onerror="abc" on-error="abc" evil-attr="evil">' +
      'test</nonsense-tag> good'
    )).toEqual('good test good');
    expect($filter('sanitizeHtmlForRte')(
      'good <code onerror="abc" on-error="abc" evil-attr="evil">' +
      'test</code> good'
    )).toEqual('good <code>test</code> good');

    // Handle malformed tags.
    expect($filter('sanitizeHtmlForRte')('<b>abc')).toEqual('<b>abc</b>');
    expect($filter('sanitizeHtmlForRte')('<p')).toEqual('');
    expect($filter('sanitizeHtmlForRte')('<evil')).toEqual('');
    expect($filter('sanitizeHtmlForRte')('<evil>abc')).toEqual('abc');
    expect($filter('sanitizeHtmlForRte')('</evil>abc')).toEqual('abc');
  }));

  it('should preserve RTE extensions while sanitizing HTML', inject(
    function($filter) {
      var STYLE_SUFFIX = (
        'style="box-sizing: border-box; border: 0px; vertical-align: middle; ' +
        'max-width: 100%; color: rgb(85, 85, 85); ' +
        'font-family: Roboto, Arial, sans-serif; font-size: 16px; ' +
        'font-style: normal; font-variant: normal; font-weight: normal; ' +
        'letter-spacing: normal; line-height: 29.5360012054443px; ' +
        'orphans: auto; text-align: left; text-indent: 0px; ' +
        'text-transform: none; white-space: normal; widows: 1; ' +
        'word-spacing: 0px; -webkit-text-stroke-width: 0px; ' +
        'background-color: rgb(255, 255, 255);">');

      var RAW_MATH = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-math" ' +
        'raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;" ' +
        STYLE_SUFFIX);
      var RAW_LINK = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-link" ' +
        'url-with-value="&amp;quot;https://www.example.com/abc&amp;quot;" ' +
        'text-with-value="&amp;quot;&amp;quot;" ' +
        'open_link_in_same_window-with-value="false" ' +
        STYLE_SUFFIX);
      var RAW_VIDEO = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-video" ' +
        'video_id-with-value="&amp;quot;Ntcw0H0hwPU&amp;quot;" ' +
        'start-with-value="10" ' +
        'end-with-value="20" ' +
        'autoplay-with-value="true" ' +
        STYLE_SUFFIX);
      var RAW_COLLAPSIBLE = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-collapsible" ' +
        'heading-with-value="&amp;quot;Test Collapsible&amp;quot;" ' +
        'content-with-value="&amp;quot;&amp;lt;p&amp;gt;Collapsible content' +
          '&amp;amp;nbsp;&amp;lt;oppia-noninteractive-math ' +
          'raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;' +
          '\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;' +
          '&amp;lt;/oppia-noninteractive-math&amp;gt;' +
          '&amp;lt;/p&amp;gt;&amp;quot;" ' + STYLE_SUFFIX);
      var RAW_TABS = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-tabs" ' +
        'tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Tab 1' +
        '&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;' +
        'First Tabs Content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-link ' +
        'url-with-value=\&amp;quot;&amp;amp;amp;quot;' +
        'https://www.example.com/abc&amp;amp;amp;quot;\&amp;quot; ' +
        'text-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;' +
        '\&amp;quot; open_link_in_same_window-with-value=\&amp;quot;' +
        'false\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-link&amp;gt;' +
        '&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;:&amp;quot;' +
        'Tab 2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p' +
        '&amp;gt;Second Tabs Content&amp;amp;nbsp;&amp;' +
        'lt;oppia-noninteractive-math ' +
        'raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;' +
        '\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;' +
        '&amp;lt;/oppia-noninteractive-math&amp;gt;' +
        '&amp;lt;/p&amp;gt;&amp;quot;}]" ' + STYLE_SUFFIX);

      var PROCESSED_MATH = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-math" ' +
        'raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;">');
      var PROCESSED_LINK = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-link" ' +
        'url-with-value="&amp;quot;https://www.example.com/abc&amp;quot;" ' +
        'text-with-value="&amp;quot;&amp;quot;" ' +
        'open_link_in_same_window-with-value="false">');
      var PROCESSED_VIDEO = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-video" ' +
        'video_id-with-value="&amp;quot;Ntcw0H0hwPU&amp;quot;" ' +
        'start-with-value="10" ' +
        'end-with-value="20" ' +
        'autoplay-with-value="true">');
      var PROCESSED_COLLAPSIBLE = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-collapsible" ' +
        'heading-with-value="&amp;quot;Test Collapsible&amp;quot;" ' +
        'content-with-value="&amp;quot;&amp;lt;p&amp;gt;Collapsible content' +
          '&amp;amp;nbsp;&amp;lt;oppia-noninteractive-math ' +
          'raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;' +
          '\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;' +
          '&amp;lt;/oppia-noninteractive-math&amp;gt;' +
          '&amp;lt;/p&amp;gt;&amp;quot;">');
      var PROCESSED_TABS = (
        '<img src="data:image/png;base64,iVB" ' +
        'class="oppia-noninteractive-tabs" ' +
        'tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Tab 1' +
        '&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;' +
        'First Tabs Content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-link ' +
        'url-with-value=\&amp;quot;&amp;amp;amp;quot;' +
        'https://www.example.com/abc&amp;amp;amp;quot;\&amp;quot; ' +
        'text-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;' +
        '\&amp;quot; open_link_in_same_window-with-value=\&amp;quot;' +
        'false\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-link&amp;gt;' +
        '&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;:&amp;quot;' +
        'Tab 2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p' +
        '&amp;gt;Second Tabs Content&amp;amp;nbsp;&amp;' +
        'lt;oppia-noninteractive-math ' +
        'raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;' +
        '\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;' +
        '&amp;lt;/oppia-noninteractive-math&amp;gt;' +
        '&amp;lt;/p&amp;gt;&amp;quot;}]">');

      var RAW_TEXT = '<span style="color: rgb(85, 85, 85);">plain text</span>';
      var PROCESSED_TEXT = '<span>plain text</span>';
      var RAW_BOLD_TEXT = '<b style="box-sizing: border-box;">bolded text</b>';
      var PROCESSED_BOLD_TEXT = '<b>bolded text</b>';
      var RAW_ITALIC_TEXT = '<i style="font-size: 16px;">italicized text</i>';
      var PROCESSED_ITALIC_TEXT = '<i>italicized text</i>';

      // Individual extensions.
      expect($filter('sanitizeHtmlForRte')(RAW_MATH)).toEqual(PROCESSED_MATH);
      expect($filter('sanitizeHtmlForRte')(RAW_LINK)).toEqual(PROCESSED_LINK);
      expect($filter('sanitizeHtmlForRte')(RAW_VIDEO)).toEqual(PROCESSED_VIDEO);
      expect($filter('sanitizeHtmlForRte')(RAW_COLLAPSIBLE)).toEqual(
        PROCESSED_COLLAPSIBLE);
      expect($filter('sanitizeHtmlForRte')(RAW_TABS)).toEqual(PROCESSED_TABS);

      // Combinations of extensions and text.
      expect($filter('sanitizeHtmlForRte')(RAW_MATH + RAW_MATH))
        .toEqual(PROCESSED_MATH + PROCESSED_MATH);
      expect($filter('sanitizeHtmlForRte')(RAW_MATH + RAW_TABS + RAW_VIDEO))
        .toEqual(PROCESSED_MATH + PROCESSED_TABS + PROCESSED_VIDEO);
      expect($filter('sanitizeHtmlForRte')(
        RAW_TEXT + RAW_BOLD_TEXT + RAW_MATH + RAW_TABS
      )).toEqual(
        PROCESSED_TEXT + PROCESSED_BOLD_TEXT + PROCESSED_MATH + PROCESSED_TABS);
      expect($filter('sanitizeHtmlForRte')(RAW_TEXT + RAW_MATH + RAW_TEXT))
        .toEqual(PROCESSED_TEXT + PROCESSED_MATH + PROCESSED_TEXT);
      expect($filter('sanitizeHtmlForRte')(
        RAW_TEXT + RAW_MATH + RAW_TEXT + RAW_LINK
      )).toEqual(
        PROCESSED_TEXT + PROCESSED_MATH + PROCESSED_TEXT + PROCESSED_LINK);
      expect($filter('sanitizeHtmlForRte')(
        RAW_MATH + RAW_TEXT + RAW_LINK + RAW_ITALIC_TEXT
      )).toEqual(
        PROCESSED_MATH + PROCESSED_TEXT + PROCESSED_LINK +
        PROCESSED_ITALIC_TEXT);

      // Invalid combinations.
      expect($filter('sanitizeHtmlForRte')(RAW_MATH + '<span')).toEqual(
        PROCESSED_MATH);
      expect($filter('sanitizeHtmlForRte')(
        '<img src="srcUrl" random-attr="blah-tabs">'
      )).toEqual('<img src="srcUrl">');
    }
  ));
});
