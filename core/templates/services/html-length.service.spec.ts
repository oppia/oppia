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

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(0);
  });

  it('should compute word count for strings with only paragraph tag', () => {
    const htmlString = '<p>Earth Our home planet is the third planet' +
      ' from the sun.</p>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(11);
  });

  it('should compute word count for strings with paragraph tag and' +
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
      const result = htmlLengthService.computeHtmlLengthInWords(testCase.input);
      expect(result).toBe(testCase.expected);
    }
  });

  it('should compute word count of content with text and non-text ' +
  '(math tag)', () => {
    const htmlString = '<p>Hi this seems too good to be true but what' +
      ' to do man<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{22}{12}&amp' +
      ';quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_2023' +
      '0602_112152_9d1d0gzhm9_height_3d323_width_2d495_vertical_1d07.' +
      'svg&amp;quot;}\"></oppia-noninteractive-math></p>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(14);
  });

  it('should compute word count of content with both text and non-text' +
  '(image tag)', () => {
    const htmlString = '<p>naghiue abghy gjuh &nbsp;</p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demo&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(17);
  });

  it('should compute word count of content with text and non-text ' +
  '(math tag and image tag)', () => {
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

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(28);
  });


  it('should compute word count of content with text and all non-text', () => {
    const htmlString = '<oppia-noninteractive-tabs ng-version="11.2.14"' +
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
    '<p>done!</p>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(2025);
  });

  it('should compute word count of content with text and non-text ' +
  '(Collapsible tag and tab tag)', () => {
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

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(2005);
  });

  it('should compute word count of content with text and non-text ' +
  '(link tag and concept card tag)', () => {
    const htmlString = '<p><oppia-noninteractive-skillreview ' +
    'ng-version="11.2.14" skill_id-with-value="&amp;quot;&amp;quot;"' +
     'text-with-value="&amp;quot;concept card&amp;quot;">' +
     '</oppia-noninteractive-skillreview></p>' +
    '<p>Demo hint just to check</p>' +
    '<p><oppia-noninteractive-link ng-version="11.2.14"' +
    'text-with-value="&amp;quot;Oppia link&amp;quot;"' +
    'url-with-value="&amp;quot;https://www.oppia.org/&amp;quot;"></oppia-noninteractive-link></p>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(9);
  });


  it('should compute word count of content of ordered lists', () => {
    const htmlString = '<ol><li>This is the first item</li><li> This is' +
      ' second item</li><li> This is the third item</li></ol>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(14);
  });

  it('should compute word count of content of unordered lists', () => {
    const htmlString = '<ul><li>This is the first item</li><li> This is' +
      ' second item</li><li> This is the third item</li></ul>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(14);
  });

  it('should compute character count for empty string', () => {
    const htmlString = '';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(0);
  });

  it('should compute character count for strings with only paragraph tag',
    () => {
      const htmlString = '<p>Earth Our home planet is the third planet' +
      ' from the sun.</p>';

      const result = htmlLengthService
        .computeHtmlLengthInCharacters(htmlString);

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
        .computeHtmlLengthInCharacters(testCase.input);
      expect(result).toBe(testCase.expected);
    }
  });

  it('should compute character count of content with text and non-text ' +
  '(math tag)', () => {
    const htmlString = '<p>Hi this seems too good to be true but what' +
      ' to do man<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;\\\\frac{22}{12}&amp' +
      ';quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;mathImg_2023' +
      '0602_112152_9d1d0gzhm9_height_3d323_width_2d495_vertical_1d07.' +
      'svg&amp;quot;}\"></oppia-noninteractive-math></p>';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(53);
  });

  it('should compute character count of content with both text and non-text' +
  '(image tag)', () => {
    const htmlString = '<p>naghiue abghy gjuh &nbsp;</p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demo&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(45);
  });

  it('should compute character count of content with text and non-text ' +
  '(math tag and image tag)', () => {
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

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(80);
  });


  it('should compute character count of content with text and non-text ' +
  '(Collapsible tag and tab tag)', () => {
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

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(2023);
  });


  it('should compute character count of content with text and non-text ' +
  '(link tag and concept card tag)', () => {
    const htmlString = '<p><oppia-noninteractive-skillreview ' +
    'ng-version="11.2.14" skill_id-with-value="&amp;quot;&amp;quot;"' +
     'text-with-value="&amp;quot;concept card&amp;quot;">' +
     '</oppia-noninteractive-skillreview></p>' +
    '<p>Demo hint just to check</p>' +
    '<p><oppia-noninteractive-link ng-version="11.2.14"' +
    'text-with-value="&amp;quot;Oppia link&amp;quot;"' +
    'url-with-value="&amp;quot;https://www.oppia.org/&amp;quot;"></oppia-noninteractive-link></p>';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(45);
  });

  it('should compute character count of content with text' +
   ' and all non-text', () => {
    const htmlString = '<oppia-noninteractive-tabs ng-version="11.2.14"' +
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
    '<p>done!</p>';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(2083);
  });

  it('should compute character count of content of ordered lists', () => {
    const htmlString = '<ol><li>This is the first item</li><li> This is' +
      ' second item</li><li> This is the third item</li></ol>';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(65);
  });

  it('should compute character count of content of unordered lists', () => {
    const htmlString = '<ul><li>This is the first item</li><li> This is' +
      ' second item</li><li> This is the third item</li></ul>';

    const result = htmlLengthService.computeHtmlLengthInCharacters(htmlString);

    expect(result).toBe(65);
  });

  describe('calculateBaselineLength', () => {
    it('should throw an error when a normal string' +
    ' is passed instead of an HTML tag string', () => {
      const sanitizedHtml = 'This is a normal string.';
      const calculationType = 'character';
      const customTagsLength = 0;
      expect(() => {
        htmlLengthService.calculateBaselineLength(
          sanitizedHtml, calculationType, customTagsLength);
      }).toThrowError(
        'Failed to parse HTML string.' +
      ' Ensure that a valid string that includes HTML tags is provided.');
    });

    it('should calculate the baseline length based' +
    ' on the provided HTML content and calculation type', () => {
      const sanitizedHtml = '<p>This is a test HTML string.</p>';
      const calculationType = 'character';
      const customTagsLength = 0;
      const result = htmlLengthService.calculateBaselineLength(
        sanitizedHtml, calculationType, customTagsLength);
      expect(result).toBe(27);
    });
  });

  describe('getWeightForNonTextNodes', () => {
    it('should throw an error when unable to determine ' +
    'weight for non-text node', () => {
      const nonTextNode = '<oppia-noninteractive-xyz>This is not a ' +
      'text node</oppia-noninteractive-xyz>';
      const calculationType = 'character';
      expect(() => {
        htmlLengthService.getWeightForNonTextNodes(
          nonTextNode, calculationType);
      }).toThrowError('Unable to determine weight for non-text node.');
    });
  });
});
