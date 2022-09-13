// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for SVGSanitizationService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SvgSanitizerService } from './svg-sanitizer.service';

describe('SvgSanitizerService', () => {
  let svgSanitizerService: SvgSanitizerService;
  let domParser: DOMParser = new DOMParser();
  class MockDomSanitizer {
    // eslint-disable-next-line oppia/no-bypass-security-phrase
    bypassSecurityTrustResourceUrl(str: string): string {
      return str;
    }
  }

  const invalidBase64data = 'data:image/svg+xml;base64,This is invalid %3D';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: DomSanitizer,
          useClass: MockDomSanitizer
        }
      ]
    });
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
  });

  it('should check for invalid base64 images', () => {
    expect(svgSanitizerService.isBase64Svg(invalidBase64data)).toBe(false);
  });

  it('should return null when a invalid base64 SVG is requested as' +
  'SafeResourceUrl',
  () => {
    expect(svgSanitizerService.getTrustedSvgResourceUrl(
      invalidBase64data)).toBeNull();
  });

  it(
    'should return safeResourceUrl after removing invalid tags and attributes',
    () => {
      const testCases = [
        {
          // Test when SVG has an invalid tag ('circel').
          svgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z"/></g><circel></circel></svg>'),
          expectedSvgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z"/></g></svg>')
        },
        {
          // Test when SVG has an invalid attribute ('data-name').
          svgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z" data-name="dataName"/></g></svg>'),
          expectedSvgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z"/></g></svg>')
        },
        {
          // Test when SVG has an invalid self closing tag ('paht').
          svgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><paht stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z"/></g></svg>'),
          expectedSvgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"/></svg>')
        },
        {
          // Test when SVG has more than one invalid tags ('pth', 'circel').
          svgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><pth stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z" data-custom="dataCustom"/></g><circel></circel></svg>'),
          expectedSvgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" style="vertical-align: ' +
            '-0.241ex;"><g stroke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"/></svg>')
        },
        {
          // Test when SVG has more than one invalid
          // attributes ('styyle', 'strokke').
          svgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4" styyle="vertical-align: -' +
            '0.241ex;"><g strokke="currentColor" fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z"/></g></svg>'),
          expectedSvgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1' +
            '.429ex" viewBox="0 -511.5 572.5 615.4"' +
            '><g fill="currentColor" stroke-w' +
            'idth="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
            ' d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402 Q' +
            '368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 5' +
            '9T 463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289' +
            'Z"/></g></svg>')
        },
        {
          // Test when SVG has a hidden script.
          svgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfi' +
            'le="full"><polygon id="triangle" points="0,0 0,50 50,0" fill="#' +
            '009900" stroke="#004400"/><script type="text/javascript">' +
            'alert(\'This app is probably vulnerable to XSS attacks!\');' +
            '</script></svg>'),
          expectedSvgString: (
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfi' +
            'le="full"><polygon id="triangle" points="0,0 0,50 50,0" fill="#' +
            '009900" stroke="#004400"/></svg>')
        }
      ];
      testCases.forEach(testCase => {
        let dataURI = (
          'data:image/svg+xml;base64,' +
          btoa(unescape(encodeURIComponent(testCase.svgString))));
        let safeResourceUrl = svgSanitizerService.getTrustedSvgResourceUrl(
          dataURI);
        expect(safeResourceUrl).toEqual(
          'data:image/svg+xml;base64,' +
          btoa(unescape(encodeURIComponent(testCase.expectedSvgString))));
      });
    });

  it('should remove the role attribute from the Math SVG string', () => {
    let svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" role= "img" style="vertical-align: -0.241ex;" xmln' +
      's="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="curren' +
      'tColor" stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stro' +
      'ke-width="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 ' +
      '406 402Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 4' +
      '14 59T463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z' +
      '"/></g></svg>'
    );
    let cleanedSvgString = (
      svgSanitizerService.cleanMathExpressionSvgString(svgString));
    let expectedCleanSvgString = (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.429e' +
      'x" viewBox="0 -511.5 572.5 615.4" focusable="false" style="vertical-a' +
      'lign: -0.241ex;"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(cleanedSvgString).toEqual(expectedCleanSvgString);
  });

  it('should remove custom data attribute from the SVG string', () => {
    var svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" role= "img" style="vertical-align: -0.241ex;" xmln' +
      's="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="curren' +
      'tColor" stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stro' +
      'ke-width="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 ' +
      '406 402Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 4' +
      '14 59T463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z' +
      '" data-custom="datacustom"/></g></svg>'
    );
    var cleanedSvgString = (
      svgSanitizerService.cleanMathExpressionSvgString(svgString));
    var expectedCleanSvgString = (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.429e' +
      'x" viewBox="0 -511.5 572.5 615.4" focusable="false" style="vertical-a' +
      'lign: -0.241ex;"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(cleanedSvgString).toEqual(expectedCleanSvgString);
  });

  it('should replace xmlns:xlink with xmlns in a Math SVG string', () => {
    let svgString = (
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink" width="1.33ex" height' +
      '="1.429ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="ve' +
      'rtical-align: -0.241ex;"><g stroke="currentColor" fill="currentColor"' +
      ' stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width' +
      '="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q3' +
      '68 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 ' +
      '140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"></path></' +
      'g></svg>'
    );
    let cleanedSvgString = (
      svgSanitizerService.cleanMathExpressionSvgString(svgString));
    let expectedCleanSvgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="vertical-align: -0.241ex;" xmlns="http://ww' +
      'w.w3.org/2000/svg"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(cleanedSvgString).toEqual(expectedCleanSvgString);
  });

  it('should extract dimensions from an math SVG string', () => {
    let svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="vertical-align: -0.241ex;" xmlns="http://ww' +
      'w.w3.org/2000/svg"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    let dimensions = (
      svgSanitizerService.extractDimensionsFromMathExpressionSvgString(
        svgString));
    let expectedDimension = {
      height: '1d429',
      width: '1d33',
      verticalPadding: '0d241'
    };
    expect(dimensions).toEqual(expectedDimension);
  });

  it('should extract dimensions from SVG string without style', () => {
    var svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="" xmlns="http://www.w3.org/2000/svg"><g str' +
      'oke="currentColor" fill="currentColor" stroke-width="0" transform="m' +
      'atrix(1 0 0 -1 0 0)"><path stroke-width="1" d="M52 289Q59 331 106 38' +
      '6T222 442Q257 442 2864Q412 404 406 402Q368 386 350 336Q290 115 290 7' +
      '8Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151T485 153' +
      'H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    var dimensions = (
      svgSanitizerService.extractDimensionsFromMathExpressionSvgString(
        svgString));
    var expectedDimension = {
      height: '1d429',
      width: '1d33',
      verticalPadding: ''
    };
    expect(dimensions).toEqual(expectedDimension);
  });

  it('should throw error if height attribute is missing from SVG', () => {
    var svgString = (
      '<svg width="1.33ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="" xmlns="http://www.w3.org/2000/svg"><g str' +
      'oke="currentColor" fill="currentColor" stroke-width="0" transform="m' +
      'atrix(1 0 0 -1 0 0)"><path stroke-width="1" d="M52 289Q59 331 106 38' +
      '6T222 442Q257 442 2864Q412 404 406 402Q368 386 350 336Q290 115 290 7' +
      '8Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151T485 153' +
      'H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(() => {
      svgSanitizerService.extractDimensionsFromMathExpressionSvgString(
        svgString);
    }).toThrowError('SVG height attribute is missing.');
  });

  it('should throw error if width attribute is missing from SVG', () => {
    var svgString = (
      '<svg height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="" xmlns="http://www.w3.org/2000/svg"><g str' +
      'oke="currentColor" fill="currentColor" stroke-width="0" transform="m' +
      'atrix(1 0 0 -1 0 0)"><path stroke-width="1" d="M52 289Q59 331 106 38' +
      '6T222 442Q257 442 2864Q412 404 406 402Q368 386 350 336Q290 115 290 7' +
      '8Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151T485 153' +
      'H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(() => {
      svgSanitizerService.extractDimensionsFromMathExpressionSvgString(
        svgString);
    }).toThrowError('SVG width attribute is missing.');
  });

  it('should expect dimensions.verticalPadding to be zero if attribute style' +
  'is invalid', () => {
    var svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="invalid" xmlns="http://www.w3.org/2000/svg"><g str' +
      'oke="currentColor" fill="currentColor" stroke-width="0" transform="m' +
      'atrix(1 0 0 -1 0 0)"><path stroke-width="1" d="M52 289Q59 331 106 38' +
      '6T222 442Q257 442 2864Q412 404 406 402Q368 386 350 336Q290 115 290 7' +
      '8Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151T485 153' +
      'H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    var dimensions = (
      svgSanitizerService.extractDimensionsFromMathExpressionSvgString(
        svgString));
    var expectedDimension = {
      height: '1d429',
      width: '1d33',
      verticalPadding: '0'
    };
    expect(dimensions).toEqual(expectedDimension);
  });

  it('should correctly get SVG from DataUri', () => {
    const svgString = (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.429e' +
      'x" viewBox="0 -511.5 572.5 615.4" focusable="false" style="vertical-a' +
      'lign: -0.241ex;"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    const dataURI = (
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgString))));
    const parsedSvg = svgSanitizerService.getSvgFromDataUri(dataURI);
    expect(parsedSvg).toEqual(
      domParser.parseFromString(svgString, 'image/svg+xml'));
  });

  it('should get invalid svg tags and attributes', () => {
    var dataURI = (
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" widdth="1.33ex" height="1.4' +
        '29ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="verti' +
        'cal-align: -0.241ex;"><g stroke="currentColor" fill="currentColor" ' +
        'stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-widt' +
        'h="1" d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402' +
        'Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T' +
        '463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></' +
        'g><circel></circel></svg>'
      ))));
    var invalidSvgTagsAndAttrs = (
      svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(dataURI));
    var expectedInvalidSvgTagsAndAttrs = {
      tags: ['circel'],
      attrs: ['svg:widdth']
    };
    expect(invalidSvgTagsAndAttrs).toEqual(expectedInvalidSvgTagsAndAttrs);
  });

  it('should catch malicious SVGs', () => {
    const testCases: {
      title: string; payload: string; expected: [number, number]; }[] = [{
        title: 'DOM clobbering attack using name=body',
        payload: '<image name=body><image name=adoptNode>@mmrupp<image name=' +
        'firstElementChild><svg onload=alert(1)>',
        expected: [0, 6]
      },
      {
        title: 'DOM clobbering attack using activeElement',
        payload: '<image name=activeElement><svg onload=alert(1)>',
        expected: [0, 6]
      },
      {
        title: 'DOM clobbering attack using name=body and injecting SVG + ke' +
        'ygen',
        payload: '<image name=body><img src=x><svg onload=alert(1); autofocu' +
        's>,<keygen onfocus=alert(1); autofocus>',
        expected: [0, 6]
      },
      {
        title: 'XSS attack using onerror',
        payload: '<div id="128"><svg><style><img/src=x onerror=alert(128)// ' +
        '</b>//["\'`-->]]>]</div>',
        expected: [0, 5]
      },
      {
        title: 'Inline SVG (data-uri)',
        payload: '<div id="129"><svg><image style=\'filter:url("data:image/sv' +
        'g+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22><script>parent.al' +
        'ert(129)</script></svg>")\'>\n<!--\nSame effect with\n<image filter=' +
        '\'...\'>\n-->\n</svg>//["\'`-->]]>]</div>',
        expected: [0, 5]
      },
      {
        title: 'from="javascript:Malicious code"',
        payload: '<div id="137"><svg>\n<a xmlns:xlink="http://www.w3.org/199' +
        '9/xlink" xlink:href="?">\n<circle r="400"></circle>\n<animate attri' +
        'buteName="xlink:href" begin="0" from="javascript:alert(137)" to="&"' +
        ' />\n</a>//["\'`-->]]>]</div>',
        expected: [2, 5]
      },
      {
        title: 'mXSS behavior with SVG in Chrome 77 and alike 1/2',
        payload: '<svg></p><textarea><title><style></textarea><img src=x one' +
        'rror=alert(1)></style></title></svg>',
        expected: [0, 4]
      },
      {
        title: 'mXSS behavior with SVG in Chrome 77 and alike 2/2',
        payload: '<svg></p><title><a id="</title><img src=x onerror=alert()>' +
        '"></textarea></svg>',
        expected: [0, 4]
      },
      {
        title: 'mXSS behavior with SVG Templates in Chrome 77 and alike',
        payload: '<svg></p><title><template><style></title><img src=x onerro' +
        'r=alert(1)>',
        expected: [0, 4]
      },
      {
        title: 'mXSS behavior with embedded MathML/SVG',
        payload: '<svg></p><math><title><style><img src=x onerror=alert(1)><' +
        '/style></title>',
        expected: [0, 4]
      },
      {
        title: 'attribute-based mXSS behavior 1/3',
        payload: '<svg><p><style><g title="</style><img src=x onerror=alert(' +
        '1)>">',
        expected: [0, 5]
      },
      {
        title: 'attribute-based mXSS behavior 2/3',
        payload: '<svg><foreignobject><p><style><p title="</style><iframe on' +
        'load&#x3d;alert(1)<!--"></style>',
        expected: [0, 6]
      },
      {
        title: 'removal-based mXSS behavior 1/2',
        payload: '<xmp><svg><b><style><b title=\'</style><img>\'>',
        expected: [0, 6]
      },
      {
        title: 'removal-based mXSS behavior 2/2',
        payload: '<noembed><svg><b><style><b title=\'</style><img>\'>',
        expected: [0, 6]
      },
      {
        title: 'nesting-based mXSS behavior 4/5',
        payload: '<form><math><mtext></form><form><mglyph><svg><mtext><style' +
        '><path id="</style><img onerror=alert(1) src>">',
        expected: [0, 7]
      },
      {
        title: 'nesting-based mXSS behavior 5/5',
        payload: '<math><mtext><table><mglyph><svg><mtext><style><path id="<' +
        '/style><img onerror=alert(1) src>">',
        expected: [0, 9]
      }];
    testCases.forEach((testCase, index) => {
      const testCaseResult = svgSanitizerService.getInvalidSvgTagsAndAttrs(
        domParser.parseFromString(testCase.payload, 'image/svg+xml'));
      expect(testCaseResult.attrs.length).toEqual(
        testCase.expected[0], 'Attributes - Case:' + testCase.title);
      expect(testCaseResult.tags.length).toEqual(
        testCase.expected[1], 'Tags - Case:' + testCase.title);
    });
  });

  it('should return correct GitHub issue URL when invalid Tags and attributes' +
    'in the SVG are removed', () => {
    const testCases = [
      {
        invalidTagsAndAttributes: {
          tags: [], attrs: ['svg:data-custom']
        },
        correctURL: 'https://github.com/oppia/oppia/issues/new?title=Uploaded%20SVG%20image%20looks%20distorted%20in%20the%20preview&body=The%20image%20file%20is%20attached%20below%3A%0A%0A%7B%7B%20IMAGE_HERE%20%7D%7D%0A%0AScreenshots%20of%20the%20problem%3A%0A%0A%7B%7B%20SCREENSHOTS_HERE%20%7D%7D%0A%0AThe%20invalid%20tags%20and%20attributes%20reported%3A%0AAttributes%3A%20svg%3Adata-custom'
      },
      {
        invalidTagsAndAttributes: {
          tags: ['paht'], attrs: []
        },
        correctURL: 'https://github.com/oppia/oppia/issues/new?title=Uploaded%20SVG%20image%20looks%20distorted%20in%20the%20preview&body=The%20image%20file%20is%20attached%20below%3A%0A%0A%7B%7B%20IMAGE_HERE%20%7D%7D%0A%0AScreenshots%20of%20the%20problem%3A%0A%0A%7B%7B%20SCREENSHOTS_HERE%20%7D%7D%0A%0AThe%20invalid%20tags%20and%20attributes%20reported%3A%0ATags%3A%20paht'
      },
      {
        invalidTagsAndAttributes: {
          tags: ['paht', 'circel'], attrs: []
        },
        correctURL: 'https://github.com/oppia/oppia/issues/new?title=Uploaded%20SVG%20image%20looks%20distorted%20in%20the%20preview&body=The%20image%20file%20is%20attached%20below%3A%0A%0A%7B%7B%20IMAGE_HERE%20%7D%7D%0A%0AScreenshots%20of%20the%20problem%3A%0A%0A%7B%7B%20SCREENSHOTS_HERE%20%7D%7D%0A%0AThe%20invalid%20tags%20and%20attributes%20reported%3A%0ATags%3A%20paht%2C%20circel'
      },
      {
        invalidTagsAndAttributes: {
          tags: ['circel'], attrs: ['svg:data-name']
        },
        correctURL: 'https://github.com/oppia/oppia/issues/new?title=Uploaded%20SVG%20image%20looks%20distorted%20in%20the%20preview&body=The%20image%20file%20is%20attached%20below%3A%0A%0A%7B%7B%20IMAGE_HERE%20%7D%7D%0A%0AScreenshots%20of%20the%20problem%3A%0A%0A%7B%7B%20SCREENSHOTS_HERE%20%7D%7D%0A%0AThe%20invalid%20tags%20and%20attributes%20reported%3A%0ATags%3A%20circel%2C%20%0AAttributes%3A%20svg%3Adata-name'
      }
    ];
    testCases.forEach(testCase => {
      let testCaseResult = svgSanitizerService.getIssueURL(
        testCase.invalidTagsAndAttributes);
      expect(testCaseResult).toEqual(testCase.correctURL);
    });
  });
});
