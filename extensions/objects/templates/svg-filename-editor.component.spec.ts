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
 * @fileoverview Unit tests for the svg filename editor.
 */

import { AppConstants } from 'app.constants';

describe('SvgFilenameEditor', function() {
  var alertSpy = null;
  var contextService = null;
  var CsrfService = null;
  var LCDiagramEditorCtrl = null;
  var $scope = null;
  var defaultsvg = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="350" view' +
    'Box="0 0 450 350"> <rect width="450" height="350" x="0" y="0" fill="t' +
    'ransparent" /> <g transform="translate(0, 0)">  </g> </svg>');
  var linesvg = (
    '<svg xmlns="http://www.w3.org/2000/' +
    'svg" width="450" height="350" viewBox="0 0 450 350"> <rect width="450" ' +
    'height="350" x="0" y="0" fill="transparent" /> <g transform="translate(' +
    '0, 0)"> <g id="line-241c7047-7297-9aa7-486d-818cfebd30d7"><line x1="105' +
    '.5" y1="97.125" x2="145.5" y2="130.125" stroke="hsla(0, 0%, 0%, 1)" fil' +
    'l="undefined" stroke-width="2" stroke-linecap="round"></line></g> </g> ' +
    '</svg>');
  var dataUrl = 'data:image/svg+xml;utf8,' + linesvg;

  var mockLiterallyCanvas = {
    currentSvg: defaultsvg,
    _shapesInProgress: [],
    setShapeInProgress: function(shape) {
      this._shapesInProgress.push(shape);
    },
    setImageSize: function(width, height) {
      var text = (
        'The updated diagram width is ' + width +
        ' and height is ' + height);
      return text;
    },
    getSVGString: function() {
      return this.currentSvg;
    },
    teardown: function() {
      return 'LiterallyCanvas is removed';
    }
  };

  var mockAssetsBackendApiService = {
    getImageUrlForPreview: function(contentType, contentId, filepath) {
      return dataUrl;
    }
  };

  var mockImageUploadHelperService = {
    convertImageDataToImageFile: function(svgDataUri) {
      return new Blob();
    },
    generateImageFilename: function(height, widht, extension) {
      return height + '_' + widht + '.' + extension;
    },
    getInvalidSvgTagsAndAttrs: function(dataUri) {
      return { tags: [], attrs: [] };
    }
  };

  var mockImagePreloaderService = {
    getDimensionsOfImage: function() {
      return {
        width: 450,
        height: 350
      };
    }
  };

  class mockImageObject {
    source = null;
    onload = null;
    constructor() {
      this.onload = function() {
        return 'Fake onload executed';
      };
    }
    set src(url) {
      this.onload();
    }
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', mockAssetsBackendApiService);
    $provide.value('ImageLocalStorageService', {});
    $provide.value('ImagePreloaderService', mockImagePreloaderService);
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController, $q) {
    contextService = $injector.get('ContextService');
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    CsrfService = $injector.get('CsrfTokenService');
    var AlertsService = $injector.get('AlertsService');

    alertSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('1');
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
    // @ts-ignore inorder to ignore other Image object properties that
    // should be declared.
    spyOn(window, 'Image').and.returnValue(new mockImageObject());

    LCDiagramEditorCtrl = $componentController('svgFilenameEditor');
    var mockDocument = document.createElement('div');
    mockDocument.setAttribute('id', LCDiagramEditorCtrl.lcID);
    var $document = angular.element(document);
    $document.find('body').append(mockDocument.outerHTML);
    LCDiagramEditorCtrl.$onInit();
    LCDiagramEditorCtrl.lc = mockLiterallyCanvas;
  }));

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

  it('should check if diagram is created', function() {
    LCDiagramEditorCtrl.lc.currentSvg = defaultsvg;
    expect(LCDiagramEditorCtrl.isDiagramCreated()).toBe(false);
    LCDiagramEditorCtrl.lc.currentSvg = linesvg;
    expect(LCDiagramEditorCtrl.isDiagramCreated()).toBe(true);
  });

  it('should check whether user is drawing', function() {
    expect(LCDiagramEditorCtrl.isUserDrawing()).toBe(false);
    LCDiagramEditorCtrl.lc.setShapeInProgress('tool');
    expect(LCDiagramEditorCtrl.isUserDrawing()).toBe(true);
  });

  it('should save svg file created by literallyCanvas', function() {
    // responseText contains a XSSI Prefix, which is represented by )]}'
    // string. That's why double quotes is being used here. It's not
    // possible to use \' instead of ' so the XSSI Prefix won't be
    // evaluated correctly.
    /* eslint-disable quotes */
    var responseText = ")]}'\n{ \"filename\": \"imageFile1.svg\" }";
    /* eslint-enable quotes */

    LCDiagramEditorCtrl.lc.currentSvg = linesvg;
    // @ts-ignore in order to ignore JQuery properties that should
    // be declared.
    spyOn($, 'ajax').and.callFake(function() {
      var d = $.Deferred();
      d.resolve(responseText);
      return d.promise();
    });
    LCDiagramEditorCtrl.saveSVGFile();

    // $q Promises need to be forcibly resolved through a JavaScript digest,
    // which is what $apply helps kick-start.
    $scope.$apply();
    expect(LCDiagramEditorCtrl.data.savedSVGFileName).toBe('imageFile1.svg');
    expect(LCDiagramEditorCtrl.data.savedSVGUrl.toString()).toBe(dataUrl);
    expect(LCDiagramEditorCtrl.validate()).toBe(true);
  });

  it('should not save svg file when no diagram is created', function() {
    LCDiagramEditorCtrl.lc.currentSvg = defaultsvg;
    LCDiagramEditorCtrl.saveSVGFile();
    expect(alertSpy).toHaveBeenCalledWith('Custom Diagram not created.');
  });

  it('should handle rejection when saving an svg file fails', function() {
    LCDiagramEditorCtrl.lc.currentSvg = linesvg;
    var errorMessage = 'Error on saving svg file';
    // @ts-ignore in order to ignore JQuery properties that should
    // be declared.
    spyOn($, 'ajax').and.callFake(function() {
      var d = $.Deferred();
      d.reject({
        // responseText contains a XSSI Prefix, which is represented by )]}'
        // string. That's why double quotes is being used here. It's not
        // possible to use \' instead of ' so the XSSI Prefix won't be
        // evaluated correctly.
        /* eslint-disable quotes */
        responseText: ")]}'\n{ \"error\": \"" + errorMessage + "\" }"
        /* eslint-enable quotes */
      });
      return d.promise();
    });
    LCDiagramEditorCtrl.saveSVGFile();

    // $q Promises need to be forcibly resolved through a JavaScript digest,
    // which is what $apply helps kick-start.
    $scope.$apply();
    expect(alertSpy).toHaveBeenCalledWith(errorMessage);
  });

  it('should allow user to continue editing the diagram', function() {
    LCDiagramEditorCtrl.savedSVGDiagram = linesvg;
    LCDiagramEditorCtrl.continueDiagramEditing();
    LCDiagramEditorCtrl.lc = mockLiterallyCanvas;
    expect(LCDiagramEditorCtrl.diagramStatus).toBe('editing');
  });
});


describe('SvgFilenameEditor initialized with value attribute',
  function() {
    var LCDiagramEditorCtrl = null;
    var $httpBackend = null;
    var contextService = null;
    var linesvg = (
      '<svg xmlns="http://www.w3.org/2000/' +
      'svg" width="450" height="350" viewBox="0 0 450 350"> <rect width="450' +
      '" height="350" x="0" y="0" fill="transparent" /> <g transform="transl' +
      'ate(0, 0)"> <g id="line-241c7047-7297-9aa7-486d-818cfebd30d7"><line x' +
      '1="105.5" y1="97.125" x2="145.5" y2="130.125" stroke="hsla(0, 0%, 0%,' +
      ' 1)" fill="undefined" stroke-width="2" stroke-linecap="round"></line>' +
      '</g> </g> </svg>');
    var mockAssetsBackendApiService = {
      getImageUrlForPreview: function(contentType, contentId, filepath) {
        return '/imageurl_' + contentType + '_' + contentId + '_' + filepath;
      }
    };
    var mockImagePreloaderService = {
      getDimensionsOfImage: function() {
        return {
          width: 450,
          height: 350
        };
      }
    };
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('AssetsBackendApiService', mockAssetsBackendApiService);
      $provide.value('ImagePreloaderService', mockImagePreloaderService);
      $provide.value('ImageUploadHelperService', {});
    }));
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      contextService = $injector.get('ContextService');
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('1');
      LCDiagramEditorCtrl = $componentController(
        'svgFilenameEditor', null, {
          value: 'svgimageFilename1.svg'
        }
      );
      LCDiagramEditorCtrl.$onInit();
    }));

    it('should load the svg file', function() {
      $httpBackend.expect(
        'GET', '/imageurl_exploration_1_svgimageFilename1.svg'
      ).respond(linesvg);
      $httpBackend.flush();
      expect(LCDiagramEditorCtrl.diagramStatus).toBe('saved');
      expect(LCDiagramEditorCtrl.savedSVGDiagram).toBe(linesvg);
    });
  }
);

describe('SvgFilenameEditor with image save destination as ' +
  'local storage', function() {
  var contextService = null;
  var LCDiagramEditorCtrl = null;
  var defaultsvg = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="350" view' +
    'Box="0 0 450 350"> <rect width="450" height="350" x="0" y="0" fill="t' +
    'ransparent" /> <g transform="translate(0, 0)">  </g> </svg>');
  var linesvg = (
    '<svg xmlns="http://www.w3.org/2000/' +
    'svg" width="450" height="350" viewBox="0 0 450 350"> <rect width="450" ' +
    'height="350" x="0" y="0" fill="transparent" /> <g transform="translate(' +
    '0, 0)"> <g id="line-241c7047-7297-9aa7-486d-818cfebd30d7"><line x1="105' +
    '.5" y1="97.125" x2="145.5" y2="130.125" stroke="hsla(0, 0%, 0%, 1)" fil' +
    'l="undefined" stroke-width="2" stroke-linecap="round"></line></g> </g> ' +
    '</svg>');
  var dataUrl = 'data:image/svg+xml;utf8,' + linesvg;

  var mockLiterallyCanvas = {
    currentSvg: defaultsvg,
    _shapesInProgress: [],
    setImageSize: function(width, height) {
      var text = (
        'The updated diagram width is ' + width +
        ' and height is ' + height);
      return text;
    },
    getSVGString: function() {
      return this.currentSvg;
    },
    teardown: function() {
      return 'LiterallyCanvas is removed';
    }
  };

  var mockilss = {
    getObjectUrlForImage: function(filename) {
      return dataUrl;
    },
    saveImage: function(filename, imageData) {
      return 'Image file save.';
    },
    deleteImage: function(filename) {
      return 'Image file is deleted.';
    }
  };

  var mockImageUploadHelperService = {
    convertImageDataToImageFile: function(svgDataUri) {
      return new Blob();
    },
    generateImageFilename: function(height, widht, extension) {
      return height + '_' + widht + '.' + extension;
    },
    getInvalidSvgTagsAndAttrs: function(dataUri) {
      return { tags: [], attrs: [] };
    }
  };

  var mockImagePreloaderService = {
    getDimensionsOfImage: function() {
      return {
        width: 450,
        height: 350
      };
    }
  };

  class mockReaderObject {
    result = null;
    onload = null;
    constructor() {
      this.onload = function() {
        return 'Fake onload executed';
      };
    }
    readAsDataURL(file) {
      this.onload();
      return 'The file is loaded';
    }
  }

  class mockImageObject {
    source = null;
    onload = null;
    constructor() {
      this.onload = function() {
        return 'Fake onload executed';
      };
    }
    set src(url) {
      this.onload();
    }
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', {});
    $provide.value('ImageLocalStorageService', mockilss);
    $provide.value('ImagePreloaderService', mockImagePreloaderService);
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    contextService = $injector.get('ContextService');
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);

    // @ts-ignore inorder to ignore other Image object properties that
    // should be declared.
    spyOn(window, 'Image').and.returnValue(new mockImageObject());
    // @ts-ignore inorder to ignore other FileReader object properties that
    // should be declared.
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());

    LCDiagramEditorCtrl = $componentController(
      'svgFilenameEditor');
    var mockDocument = document.createElement('div');
    mockDocument.setAttribute('id', LCDiagramEditorCtrl.lcID);
    var $document = angular.element(document);
    $document.find('body').append(mockDocument.outerHTML);
    LCDiagramEditorCtrl.$onInit();
    LCDiagramEditorCtrl.lc = mockLiterallyCanvas;
  }));


  it('should save svg file to local storage created by literallyCanvas',
    function() {
      LCDiagramEditorCtrl.lc.currentSvg = linesvg;
      LCDiagramEditorCtrl.saveSVGFile();

      expect(LCDiagramEditorCtrl.data.savedSVGFileName).toBe('350_450.svg');
      expect(LCDiagramEditorCtrl.data.savedSVGUrl.toString()).toBe(dataUrl);
      expect(LCDiagramEditorCtrl.validate()).toBe(true);
    }
  );

  it('should allow user to continue editing the diagram and delete the ' +
    'image from local storage', function() {
    LCDiagramEditorCtrl.data.savedSVGFileName = 'image.svg';
    LCDiagramEditorCtrl.savedSVGDiagram = linesvg;
    LCDiagramEditorCtrl.continueDiagramEditing();
    LCDiagramEditorCtrl.lc = mockLiterallyCanvas;
    expect(LCDiagramEditorCtrl.diagramStatus).toBe('editing');
  });
});
