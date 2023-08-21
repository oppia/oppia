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

  it('should compute length for empty string', () => {
    const htmlString = '';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(0);
  });

  it('should compute length for strings with only paragraph tag', () => {
    const htmlString = '<p>Earth Our home planet is the third planet' +
      ' from the sun.</p>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(11);
  });

  it('should compute length for strings with paragraph tag and' +
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

  it('should compute length of content with text and non-text ' +
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

  it('should compute length of content with both text and non-text' +
  '(image tag)', () => {
    const htmlString = '<p>naghiue abghy gjuh &nbsp;</p>' +
      '<oppia-noninteractive-image alt-with-value="&amp;quot;Svg ' +
      'file for demol&amp;quot;" caption-with-value="&amp;quot;l;Sv' +
      'h&amp;quot;" filepath-with-value="&amp;quot;img_20230602_111340' +
      '_gsmh599zj6_height_150_width_113.svg&amp;quot;" ng-version="11.2' +
      '.14"></oppia-noninteractive-image>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(9);
  });

  it('should compute length of content of ordered lists', () => {
    const htmlString = '<ol><li>This is the first item</li><li> This is' +
      ' second item</li><li> This is the third item</li></ol>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(14);
  });

  it('should compute length of content of unordered lists', () => {
    const htmlString = '<ul><li>This is the first item</li><li> This is' +
      ' second item</li><li> This is the third item</li></ul>';

    const result = htmlLengthService.computeHtmlLengthInWords(htmlString);

    expect(result).toBe(14);
  });
});
