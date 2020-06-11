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
  var mockImageUploadHelperService = {
    getInvalidSvgTagsAndAttrs: function(dataURI) {
      return { tags: [], attrs: [] };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($injector) {
    LiterallyCanvasHelperService = $injector.get(
      'LiterallyCanvasHelperService');
  }));

  it('should parse an svg and return a snapshot object', function() {
    var mockLc = {
      colors: {
        primary: 'hsla(0, 0%, 0%, 1)',
        secondary: 'hsla(0, 0%, 100%, 1)',
        background: 'transparent'
      },
      position: {
        x: 0,
        y: 0
      },
      backgroundShapes: []
    };
    var svgTag = (
      '<svg xmlns="http://www.w3.org/2000/svg" width="450" height' +
      '="350" viewBox="0 0 450 350"> <rect width="450" height="350" x="0" y=' +
      '"0" fill="transparent" /> <g transform="translate(0, 0)"> <polyline i' +
      'd="linepath-788ef2ef-b01e-161d-ec31-134f785918ed" fill="none" points=' +
      '"18.5,14.125 18.5,14.126953125 18.5,14.1328125 18.5,14.14453125 18.5,' +
      '14.1640625 18.5,14.193359375 18.5,14.234375 18.5,14.2890625 18.5,14.3' +
      '59375 18.501953125,14.443359375 18.5078125,14.5390625 18.51953125,14.' +
      '64453125 18.5390625,14.7578125 18.568359375,14.876953125 18.609375,15' +
      ' 18.6640625,15.125 18.734375,15.25 18.81640625,15.373046875 18.90625,' +
      '15.4921875 19,15.60546875 19.09375,15.7109375 19.18359375,15.80664062' +
      '5 19.265625,15.890625 19.3359375,15.9609375 19.390625,16.015625 19.43' +
      '1640625,16.056640625 19.4609375,16.0859375 19.48046875,16.10546875 19' +
      '.4921875,16.1171875 19.498046875,16.123046875 19.5,16.125" stroke="hs' +
      'la(0, 0%, 0%, 1)" stroke-linecap="round" stroke-width="2"></polyline>' +
      '<g id="line-0ffb9b0b-3fe2-35d1-1ad9-b6c8586f9966"><line x1="20.5" y1=' +
      '"37.125" x2="122.5" y2="37.125" stroke="hsla(0, 0%, 0%, 1)" fill="und' +
      'efined" stroke-width="2" stroke-linecap="round"></line></g><g id="lin' +
      'e-8f801d1a-7626-bfea-3215-2097c8c0897c"><line x1="29.5" y1="56.125" x' +
      '2="97.5" y2="64.125" stroke="hsla(0, 0%, 0%, 1)" fill="undefined" str' +
      'oke-width="2" stroke-linecap="round" stroke-dasharray="4, 8"></line><' +
      'polygon id="position1" stroke="node" fill="hsla(0, 0%, 0%, 1)" points' +
      '="97.20789688108151,66.60787651080719 102.46575302161438,64.709206237' +
      '83698 97.79210311891849,61.64212348919281"></polygon><polygon id="pos' +
      'ition0" stroke="node" fill="hsla(0, 0%, 0%, 1)" points="97.2078968810' +
      '8151,66.60787651080719 102.46575302161438,64.70920623783698 97.792103' +
      '11891849,61.64212348919281"></polygon></g><ellipse id="ellipse-f88161' +
      '78-7741-ef68-f283-7dbc3fa0cd19" cx="85.5" cy="101.125" rx="4" ry="9" ' +
      'stroke="hsla(0, 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width=' +
      '"2"></ellipse><rect id="rectangle-47d19052-fbef-458f-d6ac-5b629d9227a' +
      '5" x="128.5" y="79.125" width="26" height="24" stroke="hsla(0, 0%, 0%' +
      ', 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="2"></rect><text id="t' +
      'ext-7db838f5-4021-5708-d4aa-92aa70a7605b" x="124.5" y="167.125" fill=' +
      '"hsla(0, 0%, 0%, 1)" style="font: italic bold 18px &quot;Helvetica Ne' +
      'ue&quot;, Helvetica, Arial, sans-serif;"><tspan x="124.5" dy="0" alig' +
      'nment-baseline="text-before-edge">hello</tspan></text><g id="polygon-' +
      'open-6f068ac7-ee18-7f65-c24d-666ef89abc4b"><polyline fill="hsla(0, 0%' +
      ', 100%, 1)" points="243.5,82.125 228.5,153.125 334.5,158.125 350.5,84' +
      '.125" stroke="none"></polyline><polyline fill="none" points="243.5,82' +
      '.125 228.5,153.125 334.5,158.125 350.5,84.125" stroke="hsla(0, 0%, 0%' +
      ', 1)" stroke-width="2" stroke-dasharray="4, 8"></polyline></g><polygo' +
      'n id="polygon-closed-e500707b-63ce-b1a1-86bb-9d80889ab8cc" fill="hsla' +
      '(0, 0%, 100%, 1)" points="225.5,241.125 264.5,310.125 409.5,280.125 3' +
      '79.5,211.125" stroke="hsla(0, 0%, 0%, 1)" stroke-width="2" stroke-das' +
      'harray="4, 8"></polygon> </g> </svg>');
    var attrs = ['x', 'y', 'x1', 'y1', 'x2', 'y2', 'color', 'width', 'height',
      'strokeWidth', 'strokeColor', 'fillColor', 'capString', 'dash',
      'endCapShapes', 'order', 'tailSize', 'pointCoordinatePairs',
      'smoothedPointCoordinatePairs', 'pointSize', 'pointColor',
      'smooth', 'isClosed', 'text', 'font', 'forcedWidth', 'forcedHeight'];
    var actualSnapshotObject = {
      colors: {
        primary: 'hsla(0, 0%, 0%, 1)',
        secondary: 'hsla(0, 0%, 100%, 1)',
        background: 'transparent'
      },
      position: {
        x: 0,
        y: 0
      },
      scale: 1,
      shapes: [
        {
          className: 'LinePath',
          data: {
            order: 3,
            tailSize: 3,
            smooth: true,
            pointCoordinatePairs: [
              [
                18.5,
                14.125
              ],
              [
                18.5,
                14.359375
              ],
              [
                18.734375,
                15.25
              ],
              [
                19.390625,
                16.015625
              ]
            ],
            smoothedPointCoordinatePairs: [
              [
                18.5,
                14.125
              ],
              [
                18.5,
                14.126953125
              ],
              [
                18.5,
                14.1328125
              ],
              [
                18.5,
                14.14453125
              ],
              [
                18.5,
                14.1640625
              ],
              [
                18.5,
                14.193359375
              ],
              [
                18.5,
                14.234375
              ],
              [
                18.5,
                14.2890625
              ],
              [
                18.5,
                14.359375
              ],
              [
                18.501953125,
                14.443359375
              ],
              [
                18.5078125,
                14.5390625
              ],
              [
                18.51953125,
                14.64453125
              ],
              [
                18.5390625,
                14.7578125
              ],
              [
                18.568359375,
                14.876953125
              ],
              [
                18.609375,
                15
              ],
              [
                18.6640625,
                15.125
              ],
              [
                18.734375,
                15.25
              ],
              [
                18.81640625,
                15.373046875
              ],
              [
                18.90625,
                15.4921875
              ],
              [
                19,
                15.60546875
              ],
              [
                19.09375,
                15.7109375
              ],
              [
                19.18359375,
                15.806640625
              ],
              [
                19.265625,
                15.890625
              ],
              [
                19.3359375,
                15.9609375
              ],
              [
                19.390625,
                16.015625
              ],
              [
                19.431640625,
                16.056640625
              ],
              [
                19.4609375,
                16.0859375
              ],
              [
                19.48046875,
                16.10546875
              ],
              [
                19.4921875,
                16.1171875
              ],
              [
                19.498046875,
                16.123046875
              ],
              [
                19.5,
                16.125
              ]
            ],
            pointSize: 2,
            pointColor: 'hsla(0, 0%, 0%, 1)'
          },
          id: '788ef2ef-b01e-161d-ec31-134f785918ed'
        },
        {
          className: 'Line',
          data: {
            x1: 20.5,
            y1: 37.125,
            x2: 122.5,
            y2: 37.125,
            strokeWidth: 2,
            color: 'hsla(0, 0%, 0%, 1)',
            capString: 'round',
            dash: null,
            endCapShapes: [
              null,
              null
            ]
          },
          id: '0ffb9b0b-3fe2-35d1-1ad9-b6c8586f9966'
        },
        {
          className: 'Line',
          data: {
            x1: 29.5,
            y1: 56.125,
            x2: 97.5,
            y2: 64.125,
            strokeWidth: 2,
            color: 'hsla(0, 0%, 0%, 1)',
            capString: 'round',
            dash: [
              4,
              8
            ],
            endCapShapes: [
              'arrow',
              'arrow'
            ]
          },
          id: '8f801d1a-7626-bfea-3215-2097c8c0897c'
        },
        {
          className: 'Ellipse',
          data: {
            x: 81.5,
            y: 92.125,
            width: 8,
            height: 18,
            strokeWidth: 2,
            strokeColor: 'hsla(0, 0%, 0%, 1)',
            fillColor: 'hsla(0, 0%, 100%, 1)'
          },
          id: 'f8816178-7741-ef68-f283-7dbc3fa0cd19'
        },
        {
          className: 'Rectangle',
          data: {
            x: 128.5,
            y: 79.125,
            width: 26,
            height: 24,
            strokeWidth: 2,
            strokeColor: 'hsla(0, 0%, 0%, 1)',
            fillColor: 'hsla(0, 0%, 100%, 1)'
          },
          id: '47d19052-fbef-458f-d6ac-5b629d9227a5'
        },
        {
          className: 'Text',
          data: {
            x: 124.5,
            y: 167.125,
            text: 'hello',
            color: 'hsla(0, 0%, 0%, 1)',
            font: (
              'italic bold 18px \"Helvetica Neue\", Helvetica, Arial, ' +
              'sans-serif'),
            forcedWidth: 0,
            forcedHeight: 0
          },
          id: '7db838f5-4021-5708-d4aa-92aa70a7605b'
        },
        {
          className: 'Polygon',
          data: {
            strokeWidth: 2,
            fillColor: 'hsla(0, 0%, 100%, 1)',
            strokeColor: 'hsla(0, 0%, 0%, 1)',
            dash: [
              4,
              8
            ],
            isClosed: false,
            pointCoordinatePairs: [
              [
                243.5,
                82.125
              ],
              [
                228.5,
                153.125
              ],
              [
                334.5,
                158.125
              ],
              [
                350.5,
                84.125
              ]
            ]
          },
          id: '6f068ac7-ee18-7f65-c24d-666ef89abc4b'
        },
        {
          className: 'Polygon',
          data: {
            strokeWidth: 2,
            fillColor: 'hsla(0, 0%, 100%, 1)',
            strokeColor: 'hsla(0, 0%, 0%, 1)',
            dash: [
              4,
              8
            ],
            isClosed: true,
            pointCoordinatePairs: [
              [
                225.5,
                241.125
              ],
              [
                264.5,
                310.125
              ],
              [
                409.5,
                280.125
              ],
              [
                379.5,
                211.125
              ]
            ]
          },
          id: 'e500707b-63ce-b1a1-86bb-9d80889ab8cc'
        }
      ],
      backgroundShapes: [],
      imageSize: {
        width: '450',
        height: '350'
      }
    };
    for (var i = 0; i < actualSnapshotObject.shapes.length; i++) {
      var data = actualSnapshotObject.shapes[i].data;
      for (var j = 0; j < attrs.length; j++) {
        if (!(attrs[j] in data)) {
          data[attrs[j]] = null;
        }
      }
    }
    var snapshotObject = LiterallyCanvasHelperService.parseSvg(svgTag, mockLc);
    expect(snapshotObject).toEqual(actualSnapshotObject);
  });

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
});

describe('LiterallyCanvasHelperService svg tag validation', function() {
  var LiterallyCanvasHelperService = null;
  var mockImageUploadHelperService = {
    getInvalidSvgTagsAndAttrs: function(dataURI) {
      return { tags: ['script'], attrs: [] };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($injector) {
    LiterallyCanvasHelperService = $injector.get(
      'LiterallyCanvasHelperService');
  }));

  it('should fail svg validation', function() {
    var invalidSvgTag = (
      '<svg width="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height29" stroke="hsla(0' +
      ', 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '<script src="evil.com"></script></svg>');
    expect(() => {
      LiterallyCanvasHelperService.isSvgTagValid(invalidSvgTag);
    }).toThrowError('Invalid tags in svg:script');
  });
});

describe('LiterallyCanvasHelperService svg attribute validation', function() {
  var LiterallyCanvasHelperService = null;
  var mockImageUploadHelperService = {
    getInvalidSvgTagsAndAttrs: function(dataURI) {
      return { tags: [], attrs: ['widht'] };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($injector) {
    LiterallyCanvasHelperService = $injector.get(
      'LiterallyCanvasHelperService');
  }));

  it('should fail svg validation', function() {
    var invalidWidthAttribute = (
      '<svg widht="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height="29" stroke="hsla' +
      '(0, 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '</svg>');
    expect(() => {
      LiterallyCanvasHelperService.isSvgTagValid(invalidWidthAttribute);
    }).toThrowError('Invalid attributes in svg:widht');
  });
});
