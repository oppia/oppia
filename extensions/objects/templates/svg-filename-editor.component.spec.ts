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

const { fabric } = require('fabric');
import { AppConstants } from 'app.constants';

describe('SvgFilenameEditor', function() {
  var alertSpy = null;
  var contextService = null;
  var CsrfService = null;
  var svgFilenameCtrl = null;
  var $scope = null;
  var samplesvg = (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 494 367' +
    '"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(10,245,49,0.607)"/><g transfor' +
    'm="matrix(1 0 0 1 273.5 177.5)"><rect style="stroke: rgb(0,0,0); stroke' +
    '-width: 9; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoff' +
    'set: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0);' +
    ' fill-rule: nonzero; opacity: 1;" vector-effect="non-scaling-stroke" x=' +
    '"-30" y="-35" rx="0" ry="0" width="60" height="70"/></g><g transform="m' +
    'atrix(1 0 0 1 169.5 182.5)"><circle style="stroke: rgb(0,0,0); stroke-w' +
    'idth: 9; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffse' +
    't: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); f' +
    'ill-rule: nonzero; opacity: 1;" vector-effect="non-scaling-stroke" cx="' +
    '0" cy="0" r="30"/></g><g transform="matrix(1 0 0 2.15 100.49 123.68)" s' +
    'tyle=""><text font-family="helvetica" font-size="18" font-style="nor' +
    'mal" font-weight="normal" style="stroke: none; stroke-width: 1; stroke-' +
    'dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-lin' +
    'ejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzer' +
    'o; opacity: 1; white-space: pre;"><tspan x="-43.99" y="-17.94" style="w' +
    'hite-space: pre; ">Enter </tspan><tspan x="-43.99" y="29.25">Text</tspa' +
    'n></text></g></svg>');
  var dataUrl = 'data:image/svg+xml;utf8,' + samplesvg;

  var mockAssetsBackendApiService = {
    getImageUrlForPreview: function(contentType, contentId, filepath) {
      return dataUrl;
    }
  };

  var mockImageUploadHelperService = {
    convertImageDataToImageFile: function(svgDataUri) {
      return new Blob();
    },
    generateImageFilename: function(height, width, extension) {
      return height + '_' + width + '.' + extension;
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

  var polyPoint = function(x, y) {
    this.x = x;
    this.y = y;
  };

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

    svgFilenameCtrl = $componentController('svgFilenameEditor');
    var mockDocument = document.createElement('div');
    var strokeDiv = document.createElement('div');
    strokeDiv.setAttribute('id', 'stroke-color');
    var fillDiv = document.createElement('div');
    fillDiv.setAttribute('id', 'fill-color');
    var bgDiv = document.createElement('div');
    bgDiv.setAttribute('id', 'bg-color');
    mockDocument.appendChild(strokeDiv);
    mockDocument.appendChild(fillDiv);
    mockDocument.appendChild(bgDiv);
    var mockCanvas = document.createElement('canvas');
    mockCanvas.setAttribute('id', svgFilenameCtrl.canvasID);
    mockDocument.appendChild(mockCanvas);
    var $document = angular.element(document);
    $document.find('body').append(mockDocument.outerHTML);
    svgFilenameCtrl.$onInit();
    svgFilenameCtrl.canvas = new fabric.Canvas(svgFilenameCtrl.canvasID);
    svgFilenameCtrl.initializeMouseEvents();
    var mockFillPicker = {
      setOptions: function(data) {
        return 'The value is set.';
      }
    };
    svgFilenameCtrl.fillPicker = mockFillPicker;
  }));

  it('should update diagram size', function() {
    var WIDTH = 100;
    var HEIGHT = 100;
    svgFilenameCtrl.diagramWidth = WIDTH;
    svgFilenameCtrl.diagramHeight = HEIGHT;
    svgFilenameCtrl.onWidthInputBlur();
    expect(svgFilenameCtrl.currentDiagramWidth).toBe(WIDTH);
    svgFilenameCtrl.onHeightInputBlur();
    expect(svgFilenameCtrl.currentDiagramHeight).toBe(HEIGHT);
  });

  it('should return information on diagram size', function() {
    var maxDiagramWidth = 491;
    var maxDiagramHeight = 551;
    var helpText = (
      'This diagram has a maximum dimension of ' +
      maxDiagramWidth + 'px X ' + maxDiagramHeight +
      'px to ensure that it fits in the card.');
    expect(svgFilenameCtrl.getDiagramSizeInfo()).toBe(helpText);
  });

  it('should check if diagram is created', function() {
    var rect = new fabric.Rect({
      top: 10,
      left: 10,
      width: 60,
      height: 70,
    });
    svgFilenameCtrl.canvas.add(rect);
    expect(svgFilenameCtrl.isDiagramCreated()).toBe(true);
  });

  it('should create different shapes', function() {
    svgFilenameCtrl.createRect();
    svgFilenameCtrl.createLine();
    svgFilenameCtrl.createCircle();
    svgFilenameCtrl.createText();
    expect(svgFilenameCtrl.canvas.getObjects()[0].get('type')).toBe('rect');
    expect(svgFilenameCtrl.canvas.getObjects()[1].get('type')).toBe('line');
    expect(svgFilenameCtrl.canvas.getObjects()[2].get('type')).toBe('circle');
    expect(svgFilenameCtrl.canvas.getObjects()[3].get('type')).toBe('textbox');

    svgFilenameCtrl.togglePencilDrawing();
    expect(svgFilenameCtrl.isPencilEnabled()).toBe(true);
    svgFilenameCtrl.togglePencilDrawing();
    svgFilenameCtrl.createOpenPolygon();
    expect(svgFilenameCtrl.isOpenPolygonEnabled()).toBe(true);
    svgFilenameCtrl.createOpenPolygon();
    svgFilenameCtrl.polyOptions.lines.push(new fabric.Line([10, 10, 50, 50]));
    svgFilenameCtrl.polyOptions.bboxPoints.push(new polyPoint(10, 10));
    svgFilenameCtrl.createClosedPolygon();
    expect(svgFilenameCtrl.isClosedPolygonEnabled()).toBe(true);
    svgFilenameCtrl.createClosedPolygon();
    svgFilenameCtrl.copyColor();
    expect(svgFilenameCtrl.isEyeDropperEnabled()).toBe(true);
  });

  it('should undo and redo the creation of shapes', function() {
    for (var i = 0; i < 6; i++) {
      svgFilenameCtrl.createRect();
    }
    expect(svgFilenameCtrl.canvas.getObjects().length).toBe(6);
    svgFilenameCtrl.onUndo();
    expect(svgFilenameCtrl.canvas.getObjects().length).toBe(5);
    svgFilenameCtrl.onRedo();
    expect(svgFilenameCtrl.canvas.getObjects().length).toBe(6);
    svgFilenameCtrl.canvas.setActiveObject(
      svgFilenameCtrl.canvas.getObjects()[5]);
    svgFilenameCtrl.removeShape();
    expect(svgFilenameCtrl.canvas.getObjects().length).toBe(5);
    svgFilenameCtrl.onUndo();
    expect(svgFilenameCtrl.canvas.getObjects().length).toBe(6);
    svgFilenameCtrl.onRedo();
    expect(svgFilenameCtrl.canvas.getObjects().length).toBe(5);
    svgFilenameCtrl.onClear();
    expect(svgFilenameCtrl.objectUndoStack.length).toBe(0);
  });

  it('should change properties of a shape', function() {
    svgFilenameCtrl.createRect();
    svgFilenameCtrl.canvas.setActiveObject(
      svgFilenameCtrl.canvas.getObjects()[0]);
    var color = 'rgba(10, 10, 10, 1)';
    svgFilenameCtrl.fabricjsOptions.stroke = color;
    svgFilenameCtrl.fabricjsOptions.fill = color;
    svgFilenameCtrl.fabricjsOptions.bg = color;
    svgFilenameCtrl.fabricjsOptions.size = '10px';
    svgFilenameCtrl.onStrokeChange();
    svgFilenameCtrl.onFillChange();
    svgFilenameCtrl.onBgChange();
    svgFilenameCtrl.onSizeChange();
    var rectShape = svgFilenameCtrl.canvas.getObjects()[0];
    expect(rectShape.get('stroke')).toBe(color);
    expect(rectShape.get('fill')).toBe(color);
    expect(svgFilenameCtrl.canvas.backgroundColor).toBe(color);
    expect(rectShape.get('strokeWidth')).toBe(10);
    svgFilenameCtrl.createText();
    svgFilenameCtrl.fabricjsOptions.bold = true;
    svgFilenameCtrl.fabricjsOptions.italic = true;
    svgFilenameCtrl.fabricjsOptions.fontFamily = 'comic sans ms';
    svgFilenameCtrl.fabricjsOptions.size = '12px';
    svgFilenameCtrl.canvas.discardActiveObject();
    svgFilenameCtrl.canvas.setActiveObject(
      svgFilenameCtrl.canvas.getObjects()[1]);
    svgFilenameCtrl.onItalicToggle();
    svgFilenameCtrl.onBoldToggle();
    svgFilenameCtrl.onFontChange();
    svgFilenameCtrl.onSizeChange();
    var textObj = svgFilenameCtrl.canvas.getObjects()[1];
    expect(textObj.get('fontStyle')).toBe('italic');
    expect(textObj.get('fontWeight')).toBe('bold');
    expect(textObj.get('fontFamily')).toBe('comic sans ms');
    expect(textObj.get('fontSize')).toBe(12);
  });

  it('should trigger mouse events', function() {
    svgFilenameCtrl.drawMode = 'polygon';
    svgFilenameCtrl.canvas.trigger('mouse:down', {
      e: {
        pageX: 0,
        pageY: 0
      }
    });
    svgFilenameCtrl.canvas.trigger('mouse:move', {
      e: {
        pageX: 100,
        pageY: 100
      }
    });
    svgFilenameCtrl.canvas.trigger('mouse:dblclick');
    expect(svgFilenameCtrl.canvas.getObjects()[0].get('type')).toBe('polyline');
    svgFilenameCtrl.drawMode = 'eyedropper';
    var mockCanvasElement = {
      getContext: function(data) {
        return {
          getImageData: function(data) {
            return {
              data: [1, 2, 3, 4]
            };
          }
        };
      }
    };
    svgFilenameCtrl.canvasElement = mockCanvasElement;
    svgFilenameCtrl.canvas.trigger('mouse:down', {
      e: {
        pageX: 0,
        pageY: 0
      }
    });
    expect(svgFilenameCtrl.fabricjsOptions.fill).toBe('rgba(1,2,3,4)');
  });

  it('should save svg file created by the editor', function() {
    svgFilenameCtrl.createText();

    // responseText contains a XSSI Prefix, which is represented by )]}'
    // string. That's why double quotes is being used here. It's not
    // possible to use \' instead of ' so the XSSI Prefix won't be
    // evaluated correctly.
    /* eslint-disable quotes */
    var responseText = ")]}'\n{ \"filename\": \"imageFile1.svg\" }";
    /* eslint-enable quotes */

    // @ts-ignore in order to ignore JQuery properties that should
    // be declared.
    spyOn($, 'ajax').and.callFake(function() {
      var d = $.Deferred();
      d.resolve(responseText);
      return d.promise();
    });
    svgFilenameCtrl.saveSVGFile();

    // $q Promises need to be forcibly resolved through a JavaScript digest,
    // which is what $apply helps kick-start.
    $scope.$apply();
    expect(svgFilenameCtrl.data.savedSVGFileName).toBe('imageFile1.svg');
    expect(svgFilenameCtrl.data.savedSVGUrl.toString()).toBe(dataUrl);
    expect(svgFilenameCtrl.validate()).toBe(true);
  });

  it('should not save svg file when no diagram is created', function() {
    svgFilenameCtrl.saveSVGFile();
    expect(alertSpy).toHaveBeenCalledWith('Custom Diagram not created.');
  });

  it('should handle rejection when saving an svg file fails', function() {
    svgFilenameCtrl.createRect();
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
    svgFilenameCtrl.saveSVGFile();

    // $q Promises need to be forcibly resolved through a JavaScript digest,
    // which is what $apply helps kick-start.
    $scope.$apply();
    expect(alertSpy).toHaveBeenCalledWith(errorMessage);
  });

  it('should allow user to continue editing the diagram', function() {
    svgFilenameCtrl.savedSVGDiagram = 'saved';
    svgFilenameCtrl.savedSVGDiagram = samplesvg;
    svgFilenameCtrl.continueDiagramEditing();
    expect(svgFilenameCtrl.diagramStatus).toBe('editing');
  });
});


describe('SvgFilenameEditor initialized with value attribute',
  function() {
    var svgFilenameCtrl = null;
    var $httpBackend = null;
    var contextService = null;
    var samplesvg = (
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
      'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 494' +
      ' 367"><desc>Created with Fabric.js 3.6.3</desc><rect x="0" y="0" ' +
      'width="100%" height="100%" fill="rgba(10,245,49,0.607)"/></svg>');
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

      svgFilenameCtrl = $componentController('svgFilenameEditor', null, {
        value: 'svgimageFilename1.svg'
      });
      var mockDocument = document.createElement('div');
      var strokeDiv = document.createElement('div');
      strokeDiv.setAttribute('id', 'stroke-color');
      var fillDiv = document.createElement('div');
      fillDiv.setAttribute('id', 'fill-color');
      var bgDiv = document.createElement('div');
      bgDiv.setAttribute('id', 'bg-color');
      mockDocument.appendChild(strokeDiv);
      mockDocument.appendChild(fillDiv);
      mockDocument.appendChild(bgDiv);
      var mockCanvas = document.createElement('canvas');
      mockCanvas.setAttribute('id', svgFilenameCtrl.canvasID);
      mockDocument.appendChild(mockCanvas);
      var $document = angular.element(document);
      $document.find('body').append(mockDocument.outerHTML);
      svgFilenameCtrl.$onInit();
      svgFilenameCtrl.canvas = new fabric.Canvas(svgFilenameCtrl.canvasID);
      svgFilenameCtrl.initializeMouseEvents();
    }));

    it('should load the svg file', function() {
      $httpBackend.expect(
        'GET', '/imageurl_exploration_1_svgimageFilename1.svg'
      ).respond(samplesvg);
      $httpBackend.flush();
      expect(svgFilenameCtrl.diagramStatus).toBe('saved');
      expect(svgFilenameCtrl.savedSVGDiagram).toBe(samplesvg);
    });
  }
);

describe('SvgFilenameEditor with image save destination as ' +
  'local storage', function() {
  var contextService = null;
  var svgFilenameCtrl = null;
  var samplesvg = (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
    'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 494' +
    ' 367"><desc>Created with Fabric.js 3.6.3</desc><rect x="0" y="0" ' +
    'width="100%" height="100%" fill="rgba(10,245,49,0.607)"/></svg>');
  var dataUrl = 'data:image/svg+xml;utf8,' + samplesvg;

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

    svgFilenameCtrl = $componentController('svgFilenameEditor');
    var mockDocument = document.createElement('div');
    var strokeDiv = document.createElement('div');
    strokeDiv.setAttribute('id', 'stroke-color');
    var fillDiv = document.createElement('div');
    fillDiv.setAttribute('id', 'fill-color');
    var bgDiv = document.createElement('div');
    bgDiv.setAttribute('id', 'bg-color');
    mockDocument.appendChild(strokeDiv);
    mockDocument.appendChild(fillDiv);
    mockDocument.appendChild(bgDiv);
    var mockCanvas = document.createElement('canvas');
    mockCanvas.setAttribute('id', svgFilenameCtrl.canvasID);
    mockDocument.appendChild(mockCanvas);
    var $document = angular.element(document);
    $document.find('body').append(mockDocument.outerHTML);
    svgFilenameCtrl.$onInit();
    svgFilenameCtrl.canvas = new fabric.Canvas(svgFilenameCtrl.canvasID);
    svgFilenameCtrl.initializeMouseEvents();
  }));


  it('should save svg file to local storage created by the svg editor',
    function() {
      svgFilenameCtrl.createRect();
      svgFilenameCtrl.saveSVGFile();
      expect(svgFilenameCtrl.data.savedSVGFileName).toBe('350_450.svg');
      expect(svgFilenameCtrl.data.savedSVGUrl.toString()).toBe(dataUrl);
      expect(svgFilenameCtrl.validate()).toBe(true);
    }
  );

  it('should allow user to continue editing the diagram and delete the ' +
    'image from local storage', function() {
    svgFilenameCtrl.data.savedSVGFileName = 'image.svg';
    svgFilenameCtrl.savedSVGDiagram = 'saved';
    svgFilenameCtrl.savedSVGDiagram = samplesvg;
    svgFilenameCtrl.continueDiagramEditing();
    expect(svgFilenameCtrl.diagramStatus).toBe('editing');
  });
});


describe('should fail svg tag validation', function() {
  var svgFilenameCtrl = null;
  var mockImageUploadHelperService = {
    getInvalidSvgTagsAndAttrs: function(dataURI) {
      return { tags: ['script'], attrs: [] };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', {});
    $provide.value('ImageLocalStorageService', {});
    $provide.value('ImagePreloaderService', {});
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    svgFilenameCtrl = $componentController('svgFilenameEditor');
  }));

  it('should fail svg validation', function() {
    var invalidSvgTag = (
      '<svg width="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height29" stroke="hsla(0' +
      ', 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '<script src="evil.com"></script></svg>');
    expect(() => {
      svgFilenameCtrl.isSvgTagValid(invalidSvgTag);
    }).toThrowError('Invalid tags in svg:script');
  });
});

describe('should fail svg attribute validation', function() {
  var svgFilenameCtrl = null;
  var mockImageUploadHelperService = {
    getInvalidSvgTagsAndAttrs: function(dataURI) {
      return { tags: [], attrs: ['widht'] };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', {});
    $provide.value('ImageLocalStorageService', {});
    $provide.value('ImagePreloaderService', {});
    $provide.value('ImageUploadHelperService', mockImageUploadHelperService);
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    svgFilenameCtrl = $componentController('svgFilenameEditor');
  }));

  it('should fail svg validation', function() {
    var invalidWidthAttribute = (
      '<svg widht="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height="29" stroke="hsla' +
      '(0, 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '</svg>');
    expect(() => {
      svgFilenameCtrl.isSvgTagValid(invalidWidthAttribute);
    }).toThrowError('Invalid attributes in svg:widht');
  });
});
