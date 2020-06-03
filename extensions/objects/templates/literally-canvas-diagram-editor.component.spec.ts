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
 * @fileoverview Unit tests for the literally canvas diagram editor.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('LiterallyCanvasDiagramEditor', function() {
  var LCDiagramEditorCtrl = null;
  var $httpBackend = null;
  var ecs = null;
  var CsrfService = null;
  var UrlInterpolationService = null;
  var requestUrl1 = null;
  var $timeout = null;
  var linesvg = (
    '<svg xmlns="http://www.w3.org/2000/' +
    'svg" width="450" height="350" viewBox="0 0 450 350"> <rect width="450" ' +
    'height="350" x="0" y="0" fill="transparent" /> <g transform="translate(' +
    '0, 0)"> <g id="line-241c7047-7297-9aa7-486d-818cfebd30d7"><line x1="105' +
    '.5" y1="97.125" x2="145.5" y2="130.125" stroke="hsla(0, 0%, 0%, 1)" fil' +
    'l="undefined" stroke-width="2" stroke-linecap="round"></line></g> </g> ' +
    '</svg>');
  var mockLiterallyCanvas = {
    currentSvg: (
      '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="350" view' +
      'Box="0 0 450 350"> <rect width="450" height="350" x="0" y="0" fill="t' +
      'ransparent" /> <g transform="translate(0, 0)">  </g> </svg>'),
    _shapesInProgress: [],
    setImageSize: function(width, height) {
      var text = (
        'The updated diagram width is ' + width +
        ' and height is ' + height);
      return text;
    },
    getSVGString: function() {
      return this.currentSvg;
    }
  };

  var mockabas = {
    getImageUrlForPreview: function(contentType, contentId, filepath) {
      return 'imageUrl:' + contentType + '_' + contentId + '_' + filepath;
    }
  };

  var mockiuhs = {
    convertImageDataToImageFile: function(svgDataUri) {
      return new Blob();
    },
    generateImageFilename: function(height, widht, extension) {
      return height + '_' + widht + '.' + extension;
    }
  };

  var mockips = {
    getDimensionsOfImage: function() {
      return {
        width: 450,
        height: 350
      };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', mockabas);
    $provide.value('ImagePreloaderService', mockips);
    $provide.value('ImageUploadHelperService', mockiuhs);
  }));
  beforeEach(angular.mock.module('oppia', $provide => {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController, $q) {
    ecs = $injector.get('ContextService');
    $timeout = $injector.get('$timeout');
    // $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    var imageUploadUrlTemplate = '/createhandler/imageupload/' +
          '<entity_type>/<entity_id>';
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    requestUrl1 = UrlInterpolationService.interpolateUrl(
      imageUploadUrlTemplate, {
        entity_type: 'exploration',
        entity_id: '1'
      }
    )


    spyOn(ecs, 'getEntityType').and.returnValue('exploration');
    spyOn(ecs, 'getEntityId').and.returnValue('1');
    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    LCDiagramEditorCtrl = $componentController('literallyCanvasDiagramEditor');
    // LCDiagramEditorCtrl.value = 'imageFilename1';
    var mockDocument = document.createElement('div');
    mockDocument.setAttribute('id', LCDiagramEditorCtrl.lcID);
    var $document = angular.element(document);
    $document.find('body').append(mockDocument.outerHTML);
    LCDiagramEditorCtrl.$onInit();
    LCDiagramEditorCtrl.lc = mockLiterallyCanvas;
  }));

  // afterEach(function() {
  //   $httpBackend.verifyNoOutstandingExpectation();
  //   $httpBackend.verifyNoOutstandingRequest();
  // });

  it('should update diagram size', function() {
    var WIDTH = 100;
    var HEIGHT = 100;
    LCDiagramEditorCtrl.diagramWidth = WIDTH;
    LCDiagramEditorCtrl.diagramHeight = HEIGHT;
    LCDiagramEditorCtrl.onWidthInputBlur();
    expect(LCDiagramEditorCtrl.currentDiagramWidth).toBe(WIDTH);
    LCDiagramEditorCtrl.onHeightInputBlur();
    expect(LCDiagramEditorCtrl.currentDiagramHeight).toBe(HEIGHT);
  });

  it('should return information on diagram size', function() {
    var maxDiagramWidth = 491;
    var maxDiagramHeight = 551;
    var helpText = (
      'This diagram has a maximum dimension of ' +
      maxDiagramWidth + 'px X ' + maxDiagramHeight +
      'px to ensure that it fits in the card.');
    expect(LCDiagramEditorCtrl.getDiagramSizeInfo()).toBe(helpText);
  });

  it('should validate data', function() {
    // TODO(#9357): Will be implemented once the svg data saving
    // functionality is implemented.
    expect(false).toBe(false);
  });

  it('should check if diagram is created', function() {
    expect(LCDiagramEditorCtrl.isDiagramCreated()).toBe(false);
    LCDiagramEditorCtrl.lc.currentSvg = linesvg;
    expect(LCDiagramEditorCtrl.isDiagramCreated()).toBe(true);
  });

  it('should check whether user is drawing', function() {
    expect(LCDiagramEditorCtrl.isUserDrawing()).toBe(false);
    LCDiagramEditorCtrl.lc._shapesInProgress = ['tool'];
    expect(LCDiagramEditorCtrl.isUserDrawing()).toBe(true);
  });

  // it('should set saved svg filename', function() {
  //   LCDiagramEditorCtrl.setSavedSVGFilename('image1', false);
  //   expect(LCDiagramEditorCtrl.data.savedSVGUrl).toBe('imageUrl:exploration_1_image1');
  // });

  it('should save svg file created by literallyCanvas', function() {
    LCDiagramEditorCtrl.lc.currentSvg = linesvg;
    var response = {
      filename: 'imageFile1.svg'
    };
    spyOn($, 'ajax').and.callFake(function() {
      var d = $.Deferred();
      d.resolve(response);
      return d.promise()
    });
    // $httpBackend.expectPOST(requestUrl1).respond(
    //   JSON.stringify(response));
    var dimension = {
      width: 450,
      height: 350
    };
    LCDiagramEditorCtrl.postImageToServer(dimension, new Blob());
    $timeout(2000);
    // $timeout.flush();
    // $httpBackend.flush();
    expect(LCDiagramEditorCtrl.data.savedSVGUrl).toBe('imageUrl:exploration_1_imageFile.svg');
  });
});
