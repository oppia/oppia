// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for HtmlLengthService.
 */

import { TestBed } from '@angular/core/testing';
import { DomSanitizer} from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { HtmlLengthService } from 'services/html-length.service';
import { LoggerService } from './contextual/logger.service';

class MockLoggerService {
  error(message: string) {}
}

class MockDomSanitizer {
  sanitize(context: SecurityContext, value: string): string {
    return value;
  }
}

describe('Html Length Service', () => {
  let htmlLengthService: HtmlLengthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HtmlLengthService,
        {
          provide: LoggerService,
          useClass: MockLoggerService
        },
        {
          provide: DomSanitizer,
          useClass: MockDomSanitizer
        }
      ]
    });
    htmlLengthService = TestBed.inject(HtmlLengthService);
  });

  it('should be created', () => {
    expect(htmlLengthService).toBeTruthy();
  });

  it('should compute word count for empty string', () => {
    const htmlString = '';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    expect(result).toBe(0);
  });

  it('should compute word count for strings with only paragraph tag', () => {
    const htmlString = (
      '<p>Earth Our home planet is the third planet' +
      ' from the sun.</p>');

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    expect(result).toBe(11);
  });

  it('should compute word count for strings with paragraph tag and ' +
    'descendants text nodes', () => {
    const testCases = [
      {
        input: '<p><em>This is a brief exploration about conjugations' +
          ' in Spanish.</em></p>',
        expected: 9
      },
      {
        input: '<p>This is a test.</p>',
        expected: 4
      },
      {
        input: '<p><b>This text is bolded.</b><em> This is italic</em></p>',
        expected: 7
      },
      {
        input: '<p> Check out below<br><br><b> "Text is bolded"</b></p>',
        expected: 6
      },
      {
        input: '<p>🙂 Hello, how are you?</p>',
        expected: 5
      },
      {
        input: '<p>مر حبا كيف حالك؟</p>',
        expected: 4
      },
    ];

    for (const testCase of testCases) {
      const result = htmlLengthService
        .computeHtmlLength(testCase.input, 'word');
      expect(result).toBe(testCase.expected);
    }
  });

  it('should compute word count of content with text and non-text ' +
    '(1 math tag)', () => {
    const htmlString = '<p>Hi this seems too good to be true but what' +
      ' to do man<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{22}{12}&amp' +
      ';quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_2023' +
      '0602_112152_9d1d0gzhm9_height_3d323_width_2d495_vertical_1d07.' +
      'svg&amp;quot;}\"></oppia-noninteractive-math></p>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    /*
      The paragraph "Hi this seems too good to be
      true but what to do man" contains 13 words.
      The 'math' tag is also considered as a single word.
      Therefore, the total word count is
      14 (13 words from the paragraph + 1 'math' tag).
    */
    expect(result).toBe(14);
  });

  it('should compute word count of content with both text and non-text' +
    '(1 image tag)', () => {
    const htmlString = '<p>naghiue abghy gjuh &nbsp;</p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demo&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    /*
      "naghiue abghy gjuh &nbsp;" is a paragraph with 3 words.
      "Svg file for demo" is the alt text for an image, contributing
      4 words, and the image itself counts as 10 words.
      Therefore, the total word count is 3 (paragraph) + 4 (alt text)
      + 10 (image count) = 17 words.
    */
    expect(result).toBe(17);
  });

  it('should compute word count of content with text and non-text ' +
    '(1 math tag and 1 image tag)', () => {
    const htmlString = '<p>Hi this seems too good to be true but what' +
      ' to do man<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{22}{12}&amp' +
      ';quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_2023' +
      '0602_112152_9d1d0gzhm9_height_3d323_width_2d495_vertical_1d07.' +
      'svg&amp;quot;}\"></oppia-noninteractive-math></p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demo&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    /*
      "Hi this seems too good to be true but what to do man" is a paragraph
      with 13 words. The 'math' tag is counted as 1 word. "Svg file for demo"
      is the alt text for an image, contributing 4 words, and the image itself
      counts as 10 words. Therefore, the total word count is 13 (paragraph)
      + 1 ('math' tag) + 4 (alt text) + 10 (image count) = 28 words.
    */
    expect(result).toBe(28);
  });


  it('should compute word count of content with text and all non-text' +
    '(1 Collapsible, 1 Tabs, 1 Image, 1 Link, 1 Math, 1 SkillReview,' +
    ' 1 Video)', () => {
    const htmlString = (
      '<oppia-noninteractive-tabs ng-version="11.2.14"' +
      'tab_contents-with-value="[{&amp;quot;title&amp;quot;' +
      ':&amp;quot;Hint introduction&amp;quot;,&amp;quot;content' +
      '&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;This set of tabs shows' +
      'some hints. Click on the other tabs to display the relevant' +
      'hints.&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;' +
      ':&amp;quot;Hint 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot' +
      ';&amp;lt;p&amp;gt;This is a first hint.&amp;lt;/p&amp;gt;&amp;quot' +
      ';}]"></oppia-noninteractive-tabs>' +
      '<p>Demo hint just to check</p>' +
      '<oppia-noninteractive-collapsible _nghost-xvp-c48=""' +
      'content-with-value="&amp;quot;&amp;lt;p&amp;gt;You have' +
      'opened the collapsible block.&amp;lt;/p&ht' +
      'mlLengthServiceamp;gt;&amp;quot;"' +
      'heading-with-value="&amp;quot;Sample Header&amp;quot;"' +
      'ng-version="11.2.14"></oppia-noninteractive-collapsible>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Code' +
      ' image for testing &amp;quot;" caption-with-value="&amp;quo' +
      't;Coding&amp;quot;" filepath-with-value="&amp;quot;img_2024' +
      '0201_031507_0h88rxt92n_height_43_width_490.png&amp;quot;' +
      '" ng-version="11.2.14"></oppia-noninteractive-image>' +
      '<p><oppia-noninteractive-link ng-version="11.2.14" te' +
      'xt-with-value="&amp;quot;oppia link&amp;quot;" url-with-' +
      'value="&amp;quot;https://www.oppia.org/&amp;quot;">' +
      '</oppia-noninteractive-link></p>' +
      '<p><oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;x/y&amp;quot;' +
      ',&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20240' +
      '201_031627_1vr2hlu8ly_height_2d731_width_3d679_vertical_' +
      '0d833.svg&amp;quot;}" ng-version="11.2.14"></oppia-' +
      'noninteractive-math></p>' +
      '<p><oppia-noninteractive-skillreview ng-version="11.2.14"' +
      ' skill_id-with-value="&amp;quot;&amp;quot;" text-with-v' +
      'alue="&amp;quot;concept card&amp;quot;"></oppia-nonint' +
      'eractive-skillreview></p>' +
      '<oppia-noninteractive-video _nghost-xvp-c49="" autoplay' +
      '-with-value="false" end-with-value="0" ng-version="11.2' +
      '.14" start-with-value="0" video_id-with-value="&amp;q' +
      'uot;Ntcw0H0hwPU&amp;quot;"></oppia-noninteractive-video>' +
      '<p>&nbsp;</p>' +
      '<p>done!</p>');

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');
    /*
      The 'collapsible' and 'tab' tags each add a count of 1000 words,
      totaling 2000 words. The phrases "Demo hint just to check" and "done!"
      contribute 5 and 1 words respectively, adding up to 6 words. The 'math'
      tag is counted as 1 word. "Code image for testing" is the alt text for
      an image, contributing 4 words, and the image itself counts as 10 words.
      The 'skillreview' tag contains "Concept card" and the 'link' tag
      contains "oppia link", each contributing 2 words. Therefore, the total
      word count is 2000 (tag counts) + 6 (paragraphs) + 1 ('math' tag) +
      4 (alt text) + 10 (image count) + 2 ('skillreview' tag) +
      2 ('link' tag) = 2025 words.
    */
    expect(result).toBe(2025);
  });

  it('should compute word count of content with text and non-text ' +
    '(1 Collapsible tag and 1 tab tag)', () => {
    const htmlString = '<oppia-noninteractive-tabs ng-version="11.2.14"' +
      'tab_contents-with-value="[{&amp;quot;title&amp;quot;;' +
      ':&amp;quot;Hint introduction&amp;quot;' +
      ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;' +
      'p&amp;gt;This set of tabs shows' +
      'some hints. Click on the other tabs to display' +
      'the relevant hints.&amp;lt;/p&amp;gt;&amp;quot;},' +
      '{&amp;quot;title&amp;quot;:&amp;quot;Hint 1&amp;quot;' +
      ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;This is a' +
      'first hint.&amp;lt;/p&amp;gt;&amp;quot;}]' +
      '"></oppia-noninteractive-tabs>' +
      '<p>Demo hint just to check</p><oppia-noninteractive-collapsible ' +
      '_nghost-xvp-c48="" content-with-value="&amp;quot;&amp;lt;p&amp;gt' +
      ';You have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;quot;"' +
      'heading-with-value="&amp;quot;Sample Header&amp;quot;"' +
        'ng-version="11.2.14"></oppia-noninteractive-collapsible>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');
    /*
      The 'collapsible' and 'tab' tags each add a count of 1000 words,
      totaling 2000 words. "Demo hint just to check" is a paragraph with
      5 words. Therefore, the total word count is 5 (paragraph) + 2000
      (tag counts) = 2005 words.
    */
    expect(result).toBe(2005);
  });

  it('should compute word count of content with text and non-text ' +
    '(1 link tag and 1 concept card tag)', () => {
    const htmlString = '<p><oppia-noninteractive-skillreview ' +
    'ng-version="11.2.14" skill_id-with-value="&amp;quot;&amp;quot;"' +
    'text-with-value="&amp;quot;concept card&amp;quot;">' +
    '</oppia-noninteractive-skillreview></p>' +
    '<p>Demo hint just to check</p>' +
    '<p><oppia-noninteractive-link ng-version="11.2.14"' +
    'text-with-value="&amp;quot;Oppia link&amp;quot;"' +
    'url-with-value="&amp;quot;https://www.oppia.org/&amp;quot;"></oppia-noninteractive-link></p>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    /*
      The 'skillreview' tag contains "Concept card" and the 'link' tag
      contains "oppia link", each contributing 2 words. "Demo hint just
      to check" is a paragraph with 5 words. Therefore, the total word
      count is 5 (paragraph) + 2 ('skillreview' tag) + 2 ('link' tag) = 9 words.
    */
    expect(result).toBe(9);
  });

  it('should compute word count of content of ordered lists', () => {
    const htmlString = '<ol>' +
                        '<li>This is the first item</li>' +
                        '<li> This is second item</li>' +
                        '<li> This is the third item</li>' +
                        '</ol>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    expect(result).toBe(14);
  });

  it('should compute word count of content of unordered lists', () => {
    const htmlString = '<ul>' +
                        '<li>This is the first item</li>' +
                        '<li> This is second item</li>' +
                        '<li> This is the third item</li>' +
                        '</ul>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'word');

    expect(result).toBe(14);
  });

  it('should compute character count for empty string', () => {
    const htmlString = '';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    expect(result).toBe(0);
  });

  it('should compute character count for strings with only paragraph tag',
    () => {
      const htmlString = (
        '<p>Earth Our home planet is the third planet' +
        ' from the sun.</p>');

      const result = htmlLengthService
        .computeHtmlLength(htmlString, 'character');

      expect(result).toBe(55);
    });

  it('should compute character count for strings with paragraph tag and' +
    ' descendants text nodes', () => {
    const testCases = [
      {
        input: '<p><em>This is a brief exploration about conjugations' +
          'in Spanish.</em></p>',
        expected: 57
      },
      {
        input: '<p>This is a test.</p>',
        expected: 15
      },
      {
        input: '<p><b>This text is bolded.</b><em> This is italic</em></p>',
        expected: 35
      },
      {
        input: '<p> Check out below<br><br><b> "Text is bolded"</b></p>',
        expected: 32
      },
      {
        input: '<p>🙂 Hello, how are you?</p>',
        expected: 22
      },
      {
        input: '<p>مر حبا كيف حالك؟</p>',
        expected: 16
      },
    ];

    for (const testCase of testCases) {
      const result = htmlLengthService
        .computeHtmlLength(testCase.input, 'character');
      expect(result).toBe(testCase.expected);
    }
  });

  it('should compute character count of content with text and non-text ' +
    '(1 math tag)', () => {
    const htmlString = '<p>Hi this seems too good to be true but what' +
      ' to do man<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{22}{12}&amp' +
      ';quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_2023' +
      '0602_112152_9d1d0gzhm9_height_3d323_width_2d495_vertical_1d07.' +
      'svg&amp;quot;}\"></oppia-noninteractive-math></p>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    /*
      The paragraph "Hi this seems too good to be true but what to do man"
      contains 52 characters. The 'math' tag is counted as 1 character.
      Therefore, the total character count is 52 (paragraph) +
      1 ('math' tag) = 53 characters.
    */
    expect(result).toBe(53);
  });

  it('should compute character count of content with both text and non-text' +
    '(1 image tag)', () => {
    const htmlString = '<p>naghiue abghy gjuh &nbsp;</p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demo&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    /*
      "naghiue abghy gjuh &nbsp;" is a paragraph with 18 characters.
      "Svg file for demo" is the alt text for an image, contributing
      17 characters, and the image itself counts as 10 characters.
      Therefore, the total character count is 18 (paragraph) + 17 (alt text)
      + 10 (image count) = 45 characters.
    */
    expect(result).toBe(45);
  });

  it('should compute character count of content with text and non-text ' +
    '(1 math tag and 1 image tag)', () => {
    const htmlString = '<p>Hi this seems too good to be true but what' +
      ' to do man<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{22}{12}&amp' +
      ';quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_2023' +
      '0602_112152_9d1d0gzhm9_height_3d323_width_2d495_vertical_1d07.' +
      'svg&amp;quot;}\"></oppia-noninteractive-math></p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demo&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');
    /*
      "Hi this seems too good to be true but what to do man" is a paragraph
      with 52 characters. The 'math' tag is counted as 1 character. "Svg file
      for demo" is the alt text for an image, contributing 17 characters, and
      the image itself counts as 10 characters. Therefore, the total character
      count is 52 (paragraph) + 1 ('math' tag) + 17 (alt text)
      + 10 (image count) = 80 characters.
    */
    expect(result).toBe(80);
  });


  it('should compute character count of content with text and non-text ' +
    '(1 Collapsible tag and 1 tab tag)', () => {
    const htmlString = '<oppia-noninteractive-tabs ng-version="11.2.14"' +
      'tab_contents-with-value="[{&amp;quot;title&amp;quot;;' +
      ':&amp;quot;Hint introduction&amp;quot;' +
      ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;' +
      'p&amp;gt;This set of tabs shows' +
      'some hints. Click on the other tabs to display' +
      'the relevant hints.&amp;lt;/p&amp;gt;&amp;quot;},' +
      '{&amp;quot;title&amp;quot;:&amp;quot;Hint 1&amp;quot;' +
      ',&amp;quot;content&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;This is a' +
      'first hint.&amp;lt;/p&amp;gt;&amp;quot;}]' +
      '"></oppia-noninteractive-tabs>' +
      '<p>Demo hint just to check</p><oppia-noninteractive-collapsible ' +
      '_nghost-xvp-c48="" content-with-value="&amp;quot;&amp;lt;p&amp;gt' +
      ';You have opened the collapsible block.&amp;lt;/p&amp;gt;&amp;quot;"' +
      'heading-with-value="&amp;quot;Sample Header&amp;quot;"' +
      'ng-version="11.2.14"></oppia-noninteractive-collapsible>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    /*
      The 'collapsible' and 'tab' tags each add a count of 1000 characters,
      totaling 2000 characters. "Demo hint just to check" is a paragraph with
      23 characters. Therefore, the total character count is 23 (paragraph)
      + 2000 (tag counts) = 2023 characters.
    */
    expect(result).toBe(2023);
  });


  it('should compute character count of content with text and non-text ' +
    '(1 link tag and 1 concept card tag)', () => {
    const htmlString = '<p><oppia-noninteractive-skillreview ' +
      'ng-version="11.2.14" skill_id-with-value="&amp;quot;&amp;quot;"' +
      'text-with-value="&amp;quot;concept card&amp;quot;">' +
      '</oppia-noninteractive-skillreview></p>' +
      '<p>Demo hint just to check</p>' +
      '<p><oppia-noninteractive-link ng-version="11.2.14"' +
      'text-with-value="&amp;quot;Oppia link&amp;quot;"' +
      'url-with-value="&amp;quot;https://www.oppia.org/&amp;quot;"></oppia-noninteractive-link></p>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    /*
      The 'skillreview' tag contains "Concept card" with 12 characters and
      the 'link' tag contains "oppia link" with 10 characters. "Demo hint
      just to check" is a paragraph with 23 characters. Therefore, the total
      character count is 12 ('skillreview' tag) +
      10 ('link' tag) + 23 (paragraph) = 45 characters.
    */
    expect(result).toBe(45);
  });


  it('should compute character count of content with text and all non-text' +
    '(1 Collapsible, 1 Tabs, 1 Image, 1 Link, 1 Math, 1 SkillReview,' +
    ' 1 Video)', () => {
    const htmlString = (
      '<oppia-noninteractive-tabs ng-version="11.2.14"' +
      'tab_contents-with-value="[{&amp;quot;title&amp;quot;' +
      ':&amp;quot;Hint introduction&amp;quot;,&amp;quot;content' +
      '&amp;quot;:&amp;quot;&amp;lt;p&amp;gt;This set of tabs shows' +
      'some hints. Click on the other tabs to display the relevant' +
      'hints.&amp;lt;/p&amp;gt;&amp;quot;},{&amp;quot;title&amp;quot;' +
      ':&amp;quot;Hint 1&amp;quot;,&amp;quot;content&amp;quot;:&amp;quot' +
      ';&amp;lt;p&amp;gt;This is a first hint.&amp;lt;/p&amp;gt;&amp;quot' +
      ';}]"></oppia-noninteractive-tabs>' +
      '<p>Demo hint just to check</p>' +
      '<oppia-noninteractive-collapsible _nghost-xvp-c48=""' +
      'content-with-value="&amp;quot;&amp;lt;p&amp;gt;You have' +
      'opened the collapsible block.&amp;lt;/p&amp;gt;&amp;quot;"' +
      'heading-with-value="&amp;quot;Sample Header&amp;quot;"' +
      'ng-version="11.2.14"></oppia-noninteractive-collapsible>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Code' +
      ' image for testing &amp;quot;" caption-with-value="&amp;quo' +
      't;Coding&amp;quot;" filepath-with-value="&amp;quot;img_2024' +
      '0201_031507_0h88rxt92n_height_43_width_490.png&amp;quot;' +
      '" ng-version="11.2.14"></oppia-noninteractive-image>' +
      '<p><oppia-noninteractive-link ng-version="11.2.14" te' +
      'xt-with-value="&amp;quot;oppia link&amp;quot;" url-with-' +
      'value="&amp;quot;https://www.oppia.org/&amp;quot;">' +
      '</oppia-noninteractive-link></p>' +
      '<p><oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;x/y&amp;quot;' +
      ',&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_20240' +
      '201_031627_1vr2hlu8ly_height_2d731_width_3d679_vertical_' +
      '0d833.svg&amp;quot;}" ng-version="11.2.14"></oppia-' +
      'noninteractive-math></p>' +
      '<p><oppia-noninteractive-skillreview ng-version="11.2.14"' +
      ' skill_id-with-value="&amp;quot;&amp;quot;" text-with-v' +
      'alue="&amp;quot;concept card&amp;quot;"></oppia-nonint' +
      'eractive-skillreview></p>' +
      '<oppia-noninteractive-video _nghost-xvp-c49="" autoplay' +
      '-with-value="false" end-with-value="0" ng-version="11.2' +
      '.14" start-with-value="0" video_id-with-value="&amp;q' +
      'uot;Ntcw0H0hwPU&amp;quot;"></oppia-noninteractive-video>' +
      '<p>&nbsp;</p>' +
      '<p>done!</p>');

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    /*
      The 'collapsible' and 'tab' tags each add a count of 1000 characters,
      totaling 2000 characters. "Demo hint just to check" and "done!" are
      paragraphs with 23 and 5 characters respectively, adding up
      to 28 characters. The 'math' tag is counted as 1 character.
      "Code image for testing" is the alt text for an image, contributing
      22 characters, and the image itself counts as 10 characters.
      The 'skillreview' tag contains "Concept card" and
      the 'link' tag contains "oppia link", each contributing
      12 and 10 characters respectively. Therefore, the total character
      count is 2000 (tag counts) + 28 (paragraphs) + 1 ('math' tag)
      + 22 (alt text) + 10 (image count) +
      12 ('skillreview' tag) + 10 ('link' tag) = 2083 characters.
    */
    expect(result).toBe(2083);
  });

  it('should compute character count of content of ordered lists', () => {
    const htmlString = '<ol>' +
                        '<li>This is the first item</li>' +
                        '<li> This is second item</li>' +
                        '<li> This is the third item</li>' +
                        '</ol>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    expect(result).toBe(65);
  });

  it('should compute character count of content of unordered lists', () => {
    const htmlString = '<ul>' +
                        '<li>This is the first item</li>' +
                        '<li> This is second item</li>' +
                        '<li> This is the third item</li>' +
                      '</ul>';

    const result = htmlLengthService.computeHtmlLength(htmlString, 'character');

    expect(result).toBe(65);
  });

  describe('getLengthForNonTextNodes', () => {
    it('should throw an error when unable to determine ' +
      'length for non-text node', () => {
      const nonTextNode = (
        '<oppia-noninteractive-xyz>This is not a ' +
        'text node</oppia-noninteractive-xyz>');
      const calculationType = 'character';
      expect(() => {
        htmlLengthService.getLengthForNonTextNodes(
          nonTextNode, calculationType);
      }).toThrowError('Invalid non-text node: oppia-noninteractive-xyz');
    });
  });
});
