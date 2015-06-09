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
 *
 * @author sll@google.com (Sean Lip)
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
    ['abc  a', 'abc  a', 'abc  a'],
  ];

  it('should convert HTML to and from raw text correctly', inject(function($filter) {
    htmlUnicodeHtmlPairings.forEach(function(pairing) {
      expect($filter('convertHtmlToUnicode')(pairing[0])).toEqual(pairing[1]);
      expect($filter('convertUnicodeToHtml')(pairing[1])).toEqual(pairing[2]);
    });
  }));

  var htmlUnicodeHtmlPairingsWithParams = [
    ['abc <oppia-parameter>name</oppia-parameter>  a', 'abc {{name}}  a', 'abc <oppia-parameter>name</oppia-parameter>  a'],
    ['{{{<oppia-parameter>name</oppia-parameter>', '\\\{\\\{\\\{{{name}}', '{{{<oppia-parameter>name</oppia-parameter>'],
    ['\\{\\{', '\\\\\\{\\\\\\{', '\\{\\{'],
    ['\\}}\\{\\{', '\\\\\\}\\}\\\\\\{\\\\\\{', '\\}}\\{\\{']
  ];

  it('should convert HTML-with-params to and from raw text correctly', inject(function($filter) {
    htmlUnicodeHtmlPairings.forEach(function(pairing) {
      expect($filter('convertHtmlWithParamsToUnicode')(pairing[0])).toEqual(pairing[1]);
      expect($filter('convertUnicodeWithParamsToHtml')(pairing[1])).toEqual(pairing[2]);
    });

    htmlUnicodeHtmlPairingsWithParams.forEach(function(pairing) {
      expect($filter('convertHtmlWithParamsToUnicode')(pairing[0])).toEqual(pairing[1]);
      expect($filter('convertUnicodeWithParamsToHtml')(pairing[1])).toEqual(pairing[2]);
    });
  }));

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
    'isNonempty'
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

    expect(filter('')).toBeUndefined();
    expect(filter('1.23a')).toBeUndefined();
    expect(filter('abc')).toBeUndefined();
    expect(filter('2+3')).toBeUndefined();
    expect(filter('--1.23')).toBeUndefined();
    expect(filter('=1.23')).toBeUndefined();
  }));

  it('should impose minimum bounds', inject(function($filter) {
    var filter = $filter('isAtLeast');
    var args = {minValue: -2.0};
    expect(filter(1.23, args)).toBe(true);
    expect(filter(-1.23, args)).toBe(true);
    expect(filter(-1.99, args)).toBe(true);
    expect(filter(-2, args)).toBe(true);
    expect(filter(-2.01, args)).toBe(false);
    expect(filter(-3, args)).toBe(false);
  }));

  it('should impose maximum bounds', inject(function($filter) {
    var filter = $filter('isAtMost');
    var args = {maxValue: -2.0};
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
});

describe('RTE directive', function() {
  var elm, scope, $httpBackend;

  var _DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  beforeEach(module('oppia'));
  beforeEach(inject(function($rootScope, $compile, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/rich_text_component_repository/data').respond({
      data: {
        repository: {
          'Image': [{
            frontend_name: 'image',
            name: 'Image',
            tooltip: 'Insert image',
            icon_data_url: _DATA_URI
          }]
        }
      }
    });

    elm = $compile('<text-angular-rte></text-angular-rte>')($rootScope);
    scope = $rootScope;
    scope.$digest();
  }));

  it('should convert correctly between HTML and RTE', inject(function($rootScope, $compile) {
    var testData = [
      ['<div></div>', '<div></div>'],
      ['<div>abc</div>', '<div>abc</div>'],
      ['<div>abc</div><br>', '<div>abc</div><br>'],
      ['<div>abc<span>def</span></div><b>ghi</b>', '<div>abc<span>def</span></div><b>ghi</b>'],
      ['<oppia-noninteractive-image></oppia-noninteractive-image>',
       '<img src="' + _DATA_URI + '" class="oppia-noninteractive-image">'],
      ['<oppia-noninteractive-image image_id-with-value="&amp;quot;T&amp;quot;"></oppia-noninteractive-image>',
       '<img src="' + _DATA_URI + '" class="oppia-noninteractive-image" image_id-with-value="&amp;quot;T&amp;quot;">']
    ];

    var rteControllerScope = elm.isolateScope();

    // TODO(sll): Why isn't this being auto-populated?
    rteControllerScope._RICH_TEXT_COMPONENTS = [{
      name: 'image',
      backendName: 'Image',
      tooltip: 'Insert image',
      iconDataUrl: _DATA_URI
    }];

    for (var i = 0; i < testData.length; i++) {
      expect(rteControllerScope.convertHtmlToRte(testData[i][0]))
        .toEqual(testData[i][1]);
      expect(rteControllerScope.convertRteToHtml(testData[i][1]))
        .toEqual(testData[i][0]);
    }
  }));

  it ('should filter pasted content', inject(function($filter) {
    var raw_math_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqAAAAAmJ…b21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9NYWluX1BhZ2US/BctAAAA%0AAElFTkSuQmCC%0A" class="oppia-noninteractive-math" raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;" style="box-sizing: border-box; border: 0px; vertical-align: middle; max-width: 100%; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">';
    var raw_link_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqAAAABGd…HhfunP0p%2B3vKF6/79gZqzPQLSYoUAABKPQ%2BkpVV/igAAAABJRU5ErkJg%0Agg%3D%3D%0A" class="oppia-noninteractive-link" url-with-value="&amp;quot;https://www.example.com/abc&amp;quot;" text-with-value="&amp;quot;&amp;quot;" open_link_in_same_window-with-value="false" style="box-sizing: border-box; border: 0px; vertical-align: middle; max-width: 100%; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">';
    var raw_video_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBT…G4WCgUZD6fX%2Bjv/U0ymfxoWVZo%0AmuZyf%2B8XqfGP49CCrBUAAAAASUVORK5CYII%3D%0A" class="oppia-noninteractive-video" video_id-with-value="&amp;quot;Ntcw0H0hwPU&amp;quot;" start-with-value="10" end-with-value="20" autoplay-with-value="true" style="box-sizing: border-box; border: 0px; vertical-align: middle; max-width: 100%; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">';
    var raw_collapsible_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBT…CZIk%0AZpmmu4AkvT/3aLAHox9H4Z/fzwA3lqH2dDv0B6mSc8HU1qcrAAAAAElFTkSuQmCC%0A" class="oppia-noninteractive-collapsible" heading-with-value="&amp;quot;Test Collapsible&amp;quot;" content-with-value="&amp;quot;&amp;lt;p&amp;gt;Collapsible content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-math raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-math&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;" style="box-sizing: border-box; border: 0px; vertical-align: middle; max-width: 100%; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">';
    var raw_tabs_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBT…cJfe3bJv/c3luvXX9sPSE2t11f/zF/6KYAOj9QWRU1s5XQAA%0AAABJRU5ErkJggg%3D%3D%0A" class="oppia-noninteractive-tabs" tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Tab 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;First Tabs Content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-link url-with-value=\&amp;quot;&amp;amp;amp;quot;https://www.example.com/abc&amp;amp;amp;quot;\&amp;quot; text-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; open_link_in_same_window-with-value=\&amp;quot;false\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-link&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;:&amp;quot;Tab 2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;Second Tabs Content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-math raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-math&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;}]" style="box-sizing: border-box; border: 0px; vertical-align: middle; max-width: 100%; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">';
    var processed_math_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqAAAAAmJ…b21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9NYWluX1BhZ2US/BctAAAA%0AAElFTkSuQmCC%0A" class="oppia-noninteractive-math" raw_latex-with-value="&amp;quot;\\frac{x}{y}&amp;quot;">';
    var processed_link_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqAAAABGd…HhfunP0p%2B3vKF6/79gZqzPQLSYoUAABKPQ%2BkpVV/igAAAABJRU5ErkJg%0Agg%3D%3D%0A" class="oppia-noninteractive-link" url-with-value="&amp;quot;https://www.example.com/abc&amp;quot;" text-with-value="&amp;quot;&amp;quot;" open_link_in_same_window-with-value="false">';
    var processed_video_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBT…G4WCgUZD6fX%2Bjv/U0ymfxoWVZo%0AmuZyf%2B8XqfGP49CCrBUAAAAASUVORK5CYII%3D%0A" class="oppia-noninteractive-video" video_id-with-value="&amp;quot;Ntcw0H0hwPU&amp;quot;" start-with-value="10" end-with-value="20" autoplay-with-value="true">';
    var processed_collapsible_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBT…CZIk%0AZpmmu4AkvT/3aLAHox9H4Z/fzwA3lqH2dDv0B6mSc8HU1qcrAAAAAElFTkSuQmCC%0A" class="oppia-noninteractive-collapsible" heading-with-value="&amp;quot;Test Collapsible&amp;quot;" content-with-value="&amp;quot;&amp;lt;p&amp;gt;Collapsible content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-math raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-math&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;">';
    var processed_tabs_widget = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBT…cJfe3bJv/c3luvXX9sPSE2t11f/zF/6KYAOj9QWRU1s5XQAA%0AAABJRU5ErkJggg%3D%3D%0A" class="oppia-noninteractive-tabs" tab_contents-with-value="[{&amp;quot;title&amp;quot;:&amp;quot;Tab 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;First Tabs Content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-link url-with-value=\&amp;quot;&amp;amp;amp;quot;https://www.example.com/abc&amp;amp;amp;quot;\&amp;quot; text-with-value=\&amp;quot;&amp;amp;amp;quot;&amp;amp;amp;quot;\&amp;quot; open_link_in_same_window-with-value=\&amp;quot;false\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-link&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;:&amp;quot;Tab 2&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;Second Tabs Content&amp;amp;nbsp;&amp;lt;oppia-noninteractive-math raw_latex-with-value=\&amp;quot;&amp;amp;amp;quot;\\\\frac{x}{y}&amp;amp;amp;quot;\&amp;quot;&amp;gt;&amp;lt;/oppia-noninteractive-math&amp;gt;&amp;lt;/p&amp;gt;&amp;quot;}]">';

    var raw_text = '<span style="color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);">plain text</span>';
    var processed_text = '<span>plain text</span>';
    var raw_bolded_text = '<b style="box-sizing: border-box; font-weight: bold; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">bolded text</b>';
    var processed_bolded_text = '<b>bolded text</b>';
    var raw_italic_text = '<i style="box-sizing: border-box; color: rgb(85, 85, 85); font-family: Roboto, Arial, sans-serif; font-size: 16px; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 29.5360012054443px; orphans: auto; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">italicized text</i>';
    var processed_italic_text = '<i>italicized text</i>';

    // basics
    expect($filter('pasteHandler')('test')).toEqual('test');
    expect($filter('pasteHandler')(raw_text)).toEqual(processed_text);
    expect($filter('pasteHandler')(raw_text)).toEqual(processed_text);
    expect($filter('pasteHandler')(raw_text + raw_bolded_text + raw_italic_text))
      .toEqual(processed_text + processed_bolded_text + processed_italic_text);
    // widgets
    expect($filter('pasteHandler')(raw_math_widget)).toEqual(processed_math_widget);
    expect($filter('pasteHandler')(raw_link_widget)).toEqual(processed_link_widget);
    expect($filter('pasteHandler')(raw_video_widget)).toEqual(processed_video_widget);
    expect($filter('pasteHandler')(raw_collapsible_widget)).toEqual(processed_collapsible_widget);
    expect($filter('pasteHandler')(raw_tabs_widget)).toEqual(processed_tabs_widget);
    // combinations
    expect($filter('pasteHandler')(raw_math_widget + raw_math_widget))
      .toEqual(processed_math_widget + processed_math_widget);
    expect($filter('pasteHandler')(raw_math_widget + raw_tabs_widget + raw_video_widget))
      .toEqual(processed_math_widget + processed_tabs_widget + processed_video_widget);
    expect($filter('pasteHandler')(raw_text + raw_bolded_text + raw_math_widget + raw_tabs_widget))
      .toEqual(processed_text + processed_bolded_text + processed_math_widget + processed_tabs_widget);
    expect($filter('pasteHandler')(raw_text + raw_math_widget + raw_text))
      .toEqual(processed_text + processed_math_widget + processed_text);
    expect($filter('pasteHandler')(raw_text + raw_math_widget + raw_text + raw_link_widget))
      .toEqual(processed_text + processed_math_widget + processed_text + processed_link_widget);
    expect($filter('pasteHandler')(raw_math_widget + raw_text + raw_link_widget + raw_text))
    expect($filter('pasteHandler')(raw_math_widget + raw_text + raw_link_widget + raw_italic_text))
      .toEqual(processed_math_widget + processed_text + processed_link_widget + processed_italic_text);
  }));
});
