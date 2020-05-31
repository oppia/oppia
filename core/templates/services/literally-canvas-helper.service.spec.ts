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
 * @fileoverview Unit test for LiterallyCanvasHelperService.
 */

describe('LiterallyCanvasHelperService', function() {
  var LiterallyCanvasHelperService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    LiterallyCanvasHelperService = $injector.get(
      'LiterallyCanvasHelperService');
  }));

  it('should convert a rectangle shapeobject to svg tag', function() {
    var rectShape = {
      x: 142.5,
      y: 96.5,
      width: 12,
      height: 29,
      strokeWidth: 1,
      strokeColor: 'hsla(0, 0%, 0%, 1)',
      fillColor: 'hsla(0, 0%, 100%, 1)',
      id: 'de569866-9c11-b553-f5b7-4194e2380d9f'
    };
    var actualSvgTag = (
      '<rect id="rectangle-de569866-9c11-b553-f5b7-4194e23' +
      '80d9f" x="143" y="97" width="12" height="29" stroke="hsla(0, 0%, 0%, ' +
      '1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>');
    var svgTag = null;
    svgTag = (
      LiterallyCanvasHelperService.rectangleSVGRenderer(rectShape));
    expect(svgTag).toBe(actualSvgTag);
  });

  it('should convert a ellipse shapeobject to svg tag', function() {
    var ellipseShape = {
      x: 60.5,
      y: 77.5,
      width: 30,
      height: 45,
      strokeWidth: 2,
      strokeColor: 'hsla(0, 0%, 0%, 1)',
      fillColor: 'hsla(0, 0%, 100%, 1)',
      id: '4343fcbf-b1e9-3c6d-fcc8-809c00c6ba9b'
    };
    var renderedSvgTag = (
      '<ellipse id="ellipse-4343fcbf-b1e9-3c6d-fcc8-809c0' +
      '0c6ba9b" cx="75.5" cy="99.5" rx="15" ry="22" stroke="hsla(0, 0%, 0%, ' +
      '1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="2"></ellipse>');
    var svgTag = null;
    svgTag = (
      LiterallyCanvasHelperService.ellipseSVGRenderer(ellipseShape));
    expect(svgTag).toBe(renderedSvgTag);
  });

  it('should convert a text shapeobject to svg tag', function() {
    var textShape1 = {
      x: 72.5,
      y: 142.5,
      text: 'hello',
      color: 'hsla(0, 0%, 0%, 1)',
      font: '18px \"Helvetica Neue\",Helvetica,Arial,sans-serif',
      v: 1,
      id: '90ee8761-dd62-9d70-b61a-02e6fec487e9'
    };
    var textShape2 = {
      x: 72.5,
      y: 142.5,
      text: 'hello',
      renderer: {
        lines: ['hello']
      },
      color: 'hsla(0, 0%, 0%, 1)',
      font: '18px \"Helvetica Neue\",Helvetica,Arial,sans-serif',
      v: 1,
      id: '90ee8761-dd62-b61a-9d70-02e6fec487e9'
    };
    var renderedSvgTag1 = (
      '<text id="text-90ee8761-dd62-9d70-b61a-02e6fec487' +
      'e9" x="72.5" y="142.5" fill="hsla(0, 0%, 0%, 1)" style="font: 18px &q' +
      'uot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif;"><tspan x="72' +
      '.5" dy="0" alignment-baseline="text-before-edge">hello</tspan></text>');
    var renderedSvgTag2 = (
      '<text id="text-90ee8761-dd62-b61a-9d70-02e6fec487' +
      'e9" x="72.5" y="142.5" fill="hsla(0, 0%, 0%, 1)"' +
      ' style="font: 18px &quot;Helvetica Neue&quot;, Helvetica, Arial, sans' +
      '-serif;"><tspan x="72.5" dy="0" alignment-baseline="text-before-edge"' +
      '>hello</tspan></text>');
    var svgTag1 = (
      LiterallyCanvasHelperService.textSVGRenderer(textShape1));
    expect(svgTag1).toBe(renderedSvgTag1);
    var svgTag2 = (
      LiterallyCanvasHelperService.textSVGRenderer(textShape2));
    expect(svgTag2).toBe(renderedSvgTag2);
  });

  it('should convert a line shapeobject to svg tag', function() {
    var lineShape = {
      x1: 20.5,
      y1: 104.5,
      x2: 43.5,
      y2: 97.5,
      strokeWidth: 1,
      color: 'hsla(0, 0%, 0%, 1)',
      capStyle: 'round',
      dash: [4, 8],
      endCapShapes: [
        'arrow',
        'arrow'
      ],
      id: 'dfee1d2f-4959-8371-b036-a30b2982bb20'
    };
    var renderedSvgTag = (
      '<g id="line-dfee1d2f-4959-8371-b036-a30b2982bb20">' +
      '<line x1="21" y1="105" x2="44" y2="98" stroke="hsla(0, 0%, 0%, 1)" fi' +
      'll="undefined" stroke-width="1" stroke-linecap="round" stroke-dasharr' +
      'ay="4, 8"></line><polygon id="position0" stroke="node" fill="hsla(0, ' +
      '0%, 0%, 1)" points="20.27209596054326,102.60831529892785 16.216630597' +
      '85571,106.45580807891348 21.72790403945674,107.39168470107215"></poly' +
      'gon><polygon id="position1" stroke="node" fill="hsla(0, 0%, 0%, 1)" p' +
      'oints="44.72790403945674,100.39168470107215 48.78336940214429,96.5441' +
      '9192108652 43.27209596054326,95.60831529892785"></polygon></g>');
    var svgTag = null;
    svgTag = (
      LiterallyCanvasHelperService.lineSVGRenderer(lineShape));
    expect(svgTag).toBe(renderedSvgTag);
  });

  it('should convert a linepath shapeobject to svg tag', function() {
    var linepathShape = {
      points: [
        {
          x: 57,
          y: 170,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        },
        {
          x: 65,
          y: 176,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        }
      ],
      smoothedPoints: [
        {
          x: 57,
          y: 170,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        },
        {
          x: 65,
          y: 176,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 1
        }
      ],
      id: 'e09d8a59-88d2-1714-b721-032dc017b81d'
    };
    var renderedSvgTag = (
      '<polyline id="linepath-e09d8a59-88d2-1714-b721-032' +
      'dc017b81d" fill="none" points="57,170 65.5,176.5" stroke="hsla(0, 0%,' +
      ' 0%, 1)" stroke-linecap="round" stroke-width="2"></polyline>');
    var svgTag = null;
    svgTag = (
      LiterallyCanvasHelperService.linepathSVGRenderer(linepathShape));
    expect(svgTag).toBe(renderedSvgTag);
  });

  it('should convert a polygon shapeobject to svg tag', function() {
    var closedPolygonShape = {
      strokeWidth: 2,
      fillColor: 'hsla(0, 0%, 100%, 1)',
      strokeColor: 'hsla(0, 0%, 0%, 1)',
      isClosed: true,
      points: [
        {
          x: 146,
          y: 108,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        },
        {
          x: 72,
          y: 174,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 1
        },
        {
          x: 156,
          y: 208,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        },
        {
          x: 220,
          y: 149,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        }
      ],
      id: '89874c6a-1e67-a13d-d4e4-6fa1cabbbc58'
    };
    var openPolygonShape = {
      strokeWidth: 2,
      fillColor: 'hsla(0, 0%, 100%, 1)',
      strokeColor: 'hsla(0, 0%, 0%, 1)',
      isClosed: false,
      points: [
        {
          x: 146,
          y: 108,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 1
        },
        {
          x: 72,
          y: 174,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        },
        {
          x: 156,
          y: 208,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        },
        {
          x: 220,
          y: 149,
          color: 'hsla(0, 0%, 0%, 1)',
          size: 2
        }
      ],
      id: '89874c6a-1e67-d4e4-a13d-6fa1cabbbc58'
    };
    var closedSvgTag = (
      '<polygon id="polygon-closed-89874c6a-1e67-a13d-d4e4-' +
      '6fa1cabbbc58" fill="hsla(0, 0%, 100%, 1)" points="146,108 72.5,174.5 ' +
      '156,208 220,149" stroke="hsla(0, 0%, 0%, 1)" stroke-width="2">' +
      '</polygon>');
    var openSvgTag = (
      '<g id="polygon-open-89874c6a-1e67-d4e4-a13d-6fa1cabbbc' +
      '58"><polyline fill="hsla(0, 0%, 100%, 1)" points="146.5,108.5 72,174 ' +
      '156,208 220,149" stroke="none"></polyline><polyline fill="none" point' +
      's="146.5,108.5 72,174 156,208 220,149" stroke="hsla(0, 0%, 0%, 1)" st' +
      'roke-width="2"></polyline></g>');
    var svgTag1 = (
      LiterallyCanvasHelperService.polygonSVGRenderer(closedPolygonShape));
    expect(svgTag1).toBe(closedSvgTag);
    var svgTag2 = (
      LiterallyCanvasHelperService.polygonSVGRenderer(openPolygonShape));
    expect(svgTag2).toBe(openSvgTag);
  });

  it('should fail svg validation', function() {
    var validSvgTag = (
      '<svg width="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height="29" stroke="hsla' +
      '(0, 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '</svg>');
    expect(LiterallyCanvasHelperService.isSVGTagValid(validSvgTag)).toBe(true);

    var invalidWidthAttribute = (
      '<svg widht="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height="29" stroke="hsla' +
      '(0, 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '</svg>');
    expect(() => {
      LiterallyCanvasHelperService.isSVGTagValid(invalidWidthAttribute);
    }).toThrowError('Invalid tag or attribute in svg.');

    var invalidSvgTag = (
      '<svg width="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height29" stroke="hsla(0' +
      ', 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '<script src="evil.com"></script></svg>');
    expect(() => {
      LiterallyCanvasHelperService.isSVGTagValid(invalidSvgTag);
    }).toThrowError('Invalid tag or attribute in svg.');
  });
});
