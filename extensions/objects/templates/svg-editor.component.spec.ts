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
 * @fileoverview Unit tests for the svg editor.
 */

import {fabric} from 'fabric';
import {AppConstants} from 'app.constants';
import {SvgEditorConstants} from './svg-editor.constants';
import {PolyPoint, SvgEditorComponent} from './svg-editor.component';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {ContextService} from 'services/context.service';
import {AlertsService} from 'services/alerts.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {SvgFileFetcherBackendApiService} from './svg-file-fetcher-backend-api.service';
import {of} from 'rxjs';

var initializeMockDocument = (svgFilenameCtrl: SvgEditorComponent) => {
  var mockDocument = document.createElement('div');
  var colors = ['stroke', 'fill', 'bg'];
  for (var i = 0; i < 3; i++) {
    var colorDiv = document.createElement('div');
    colorDiv.setAttribute('id', colors[i] + '-color');
    var topAlphaDiv = document.createElement('div');
    topAlphaDiv.setAttribute('id', 'top-' + colors[i] + '-alpha');
    var bottomAlphaDiv = document.createElement('div');
    bottomAlphaDiv.setAttribute('id', 'bottom-' + colors[i] + '-alpha');
    var pickerAlpha = document.createElement('div');
    pickerAlpha.setAttribute('class', 'picker_alpha');
    var pickerSlider = document.createElement('div');
    pickerSlider.setAttribute('class', 'picker_selector');
    pickerAlpha.append(pickerSlider);
    colorDiv.appendChild(topAlphaDiv);
    colorDiv.appendChild(bottomAlphaDiv);
    mockDocument.appendChild(colorDiv);
    mockDocument.appendChild(pickerAlpha);
  }
  var mockCanvas = document.createElement('canvas');

  mockCanvas.setAttribute('id', svgFilenameCtrl.canvasID);
  mockDocument.appendChild(mockCanvas);
  document.getElementsByTagName('body')[0].appendChild(mockDocument);
};

describe('SvgEditor', () => {
  var alertSpy: jasmine.Spy<(warning: string) => void>;
  let svgFileFetcherBackendApiService: SvgFileFetcherBackendApiService;
  var contextService: ContextService;
  var csrfService: CsrfTokenService;
  let fixture: ComponentFixture<SvgEditorComponent>;
  var component: SvgEditorComponent;
  let svgSanitizerService: SvgSanitizerService;
  const mockilss = {
    getRawImageData: filename => {
      return dataUrl;
    },
  };
  // This sample SVG is generated using different tools present
  // in the SVG editor.
  var samplesvg =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="368" viewBox="0 0 494 368' +
    '"><desc>Created with Fabric.js 4.4.0</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(109,106,234,0.937)"/><g transf' +
    'orm="matrix(1 0 0 1 324 91)"><rect style="stroke: rgb(0,0,0); stroke-wi' +
    'dth: 3; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset' +
    ': 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fi' +
    'll-opacity: 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scali' +
    'ng-stroke" x="-30" y="-35" rx="0" ry="0" width="60" height="70"/></g><g' +
    ' transform="matrix(1 0 0 1 321 209)"><circle style="stroke: rgb(0,0,0);' +
    ' stroke-width: 3; stroke-dasharray: none; stroke-linecap: butt; stroke-' +
    'dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(' +
    '0,0,0); fill-opacity: 0; fill-rule: nonzero; opacity: 1; vector-effect:' +
    ' non-scaling-stroke" cx="0" cy="0" r="30"/></g><g transform="matrix(1 0' +
    ' 0 1 560 82)" style=""><text font-family="helvetica" font-size="18" fon' +
    't-style="normal" font-weight="normal" style="stroke: none; stroke-width' +
    ': 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0' +
    '; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-' +
    'rule: nonzero; opacity: 1; white-space: pre;"><tspan x="-100" y="-17.94' +
    '" style="stroke: rgb(0,0,0); stroke-width: 2; fill: rgb(255,0,0); ">▇' +
    '</tspan><tspan x="-86.16" y="-17.94" style="white-space: pre; "> - Data' +
    ' name 1 - 10</tspan><tspan x="-100" y="5.65" style="stroke: rgb(0,0,0);' +
    ' stroke-width: 2; fill: rgb(0,255,0); ">▇</tspan><tspan x="-86.16" y=' +
    '"5.65" style="white-space: pre; "> - Data name 2 - 10</tspan><tspan x="' +
    '-100" y="29.25" style="stroke: rgb(0,0,0); stroke-width: 2; fill: rgb(1' +
    '90,65,65); ">▇</tspan><tspan x="-86.16" y="29.25" style="white-space:' +
    ' pre; "> - Data name - 10</tspan></text></g><g transform="matrix(1 0 0 ' +
    '1 113 222)"><g style=""><g transform="matrix(0.5 0.87 -0.87 0.5 0 0)"><' +
    'g style=""><g transform="matrix(1 0 0 1 0 0)" id="group0"><path d="M 15' +
    '.000000000000004 -25.980762113533157 A 30 30 0 0 1 15.000000000000004 2' +
    '5.980762113533157" style="stroke: rgb(255,0,0); stroke-width: 1; stroke' +
    '-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-li' +
    'nejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-rule: non' +
    'zero; opacity: 1; vector-effect: non-scaling-stroke" id="group0"/></g><' +
    'g transform="matrix(1 0 0 1 7.5 0)" id="group0"><polygon style="stroke:' +
    ' rgb(255,0,0); stroke-width: 1; stroke-dasharray: none; stroke-linecap:' +
    ' butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit:' +
    ' 4; fill: rgb(255,0,0); fill-rule: nonzero; opacity: 1; vector-effect: ' +
    'non-scaling-stroke" points="-7.5,0 7.5,25.98 7.5,-25.98 -7.5,0 " id="gr' +
    'oup0"/></g></g></g><g transform="matrix(-1 0 0 -1 0 0)"><g style=""><g ' +
    'transform="matrix(1 0 0 1 0 0)" id="group0"><path d="M 15.0000000000000' +
    '04 -25.980762113533157 A 30 30 0 0 1 15.000000000000004 25.980762113533' +
    '157" style="stroke: rgb(0,255,0); stroke-width: 1; stroke-dasharray: no' +
    'ne; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter;' +
    ' stroke-miterlimit: 4; fill: rgb(0,255,0); fill-rule: nonzero; opacity:' +
    ' 1; vector-effect: non-scaling-stroke" id="group0"/></g><g transform="m' +
    'atrix(1 0 0 1 7.5 0)" id="group0"><polygon style="stroke: rgb(0,255,0);' +
    ' stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-' +
    'dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(' +
    '0,255,0); fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-st' +
    'roke" points="-7.5,0 7.5,25.98 7.5,-25.98 -7.5,0 " id="group0"/></g></g' +
    '></g><g transform="matrix(0.5 -0.87 0.87 0.5 0 0)"><g style=""><g trans' +
    'form="matrix(1 0 0 1 0 0)" id="group0"><path d="M 14.999999999999996 -2' +
    '5.98076211353316 A 30 30 0 0 1 14.999999999999996 25.98076211353316" st' +
    'yle="stroke: rgb(190,65,65); stroke-width: 1; stroke-dasharray: none; s' +
    'troke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stro' +
    'ke-miterlimit: 4; fill: rgb(190,65,65); fill-rule: nonzero; opacity: 1;' +
    ' vector-effect: non-scaling-stroke" id="group0"/></g><g transform="matr' +
    'ix(1 0 0 1 7.5 0)" id="group0"><polygon style="stroke: rgb(190,65,65); ' +
    'stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-d' +
    'ashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(1' +
    '90,65,65); fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-s' +
    'troke" points="-7.5,0 7.5,25.98 7.5,-25.98 -7.5,0 " id="group0"/></g></' +
    'g></g></g></g></svg>';
  var dataUrl = 'data:image/svg+xml;utf8,' + samplesvg;

  var mockAssetsBackendApiService = {
    getImageUrlForPreview: (contentType, contentId, filepath) => {
      return dataUrl;
    },
  };

  var mockImageUploadHelperService = {
    convertImageDataToImageFile: svgDataUri => {
      return new Blob();
    },
    generateImageFilename: (height, width, extension) => {
      return height + '_' + width + '.' + extension;
    },
  };

  var mockSvgSanitizerService = {
    getInvalidSvgTagsAndAttrsFromDataUri: dataUri => {
      return {tags: [], attrs: []};
    },
    getTrustedSvgResourceUrl: data => {
      return data;
    },
    convertBase64ToUnicodeString: base64 => {
      return decodeURIComponent(atob(base64));
    },
  };

  var mockImagePreloaderService = {
    getDimensionsOfImage: () => {
      return {
        width: 450,
        height: 350,
      };
    },
  };

  class mockReaderObject {
    result = null;
    onload = null;
    constructor() {
      this.onload = () => {
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
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    set src(url) {
      this.onload();
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SvgEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: AssetsBackendApiService,
          useValue: mockAssetsBackendApiService,
        },
        {
          provide: ImageLocalStorageService,
          useValue: mockilss,
        },
        {
          provide: ImagePreloaderService,
          useValue: mockImagePreloaderService,
        },
        {
          provide: ImageUploadHelperService,
          useValue: mockImageUploadHelperService,
        },
        {
          provide: SvgSanitizerService,
          useValue: mockSvgSanitizerService,
        },
      ],
    }).compileComponents();
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    contextService = TestBed.inject(ContextService);
    csrfService = TestBed.inject(CsrfTokenService);
    const alertsService = TestBed.inject(AlertsService);

    alertSpy = spyOn(alertsService, 'addWarning').and.callThrough();
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('1');
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER
    );
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
    svgFileFetcherBackendApiService = TestBed.inject(
      SvgFileFetcherBackendApiService
    );
    // This throws "Argument of type 'mockImageObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this error
    // because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockImageObject'.
    // @ts-expect-error
    spyOn(window, 'Image').and.returnValue(new mockImageObject());
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this error
    // because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());
    fixture = TestBed.createComponent(SvgEditorComponent);
    component = fixture.componentInstance;
    initializeMockDocument(component);
    component.ngOnInit();
    component.canvas = new fabric.Canvas(component.canvasID);
    component.initializeMouseEvents();
    var mockPicker = {
      setOptions: data => {
        return 'The value is set.';
      },
    };
    component.fillPicker = mockPicker;
    component.strokePicker = mockPicker;
    component.bgPicker = mockPicker;
  }));

  it('should wait before updating diagram size when dom is loading', waitForAsync(
    fakeAsync(() => {
      spyOnProperty(document, 'readyState').and.returnValue('loading');
      spyOn(document, 'addEventListener').and.callFake((eventName, handler) => {
        setTimeout(() => handler());
      });
      component.ngOnInit();
      tick(10);
      component.bgPicker.onOpen();
      var WIDTH = 100;
      var HEIGHT = 100;
      component.diagramWidth = WIDTH;
      component.diagramHeight = HEIGHT;
      component.onWidthInputBlur();
      expect(component.currentDiagramWidth).toBe(WIDTH);
      component.onHeightInputBlur();
      expect(component.currentDiagramHeight).toBe(HEIGHT);
    })
  ));

  it('should add tags to canvas regardless of ids specified', waitForAsync(
    fakeAsync(() => {
      spyOnProperty(document, 'readyState').and.returnValue('loaded');
      let sampleSVGWithoutId =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
        'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 ' +
        '494 367"><desc>Created with Fabric.js 3.6.3</desc><path d="M 15.0000' +
        '00000000004 -25.980762113533157 A 30 30 0 0 1 15.000000000000004 25.' +
        '980762113533157" style="stroke: rgb(255,0,0); stroke-width: 1; strok' +
        'e-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; strok' +
        'e-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-ru' +
        'le: nonzero; opacity: 1; vector-effect: non-scaling-stroke' +
        '"/></svg>';

      component.savedSvgDiagram = 'saved';
      component.savedSvgDiagram = sampleSVGWithoutId;
      component.continueDiagramEditing();
      tick();
      expect(component.canvas.getObjects().length).toBe(1);

      let sampleSVGWithGroup =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
        'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 ' +
        '494 367"><desc>Created with Fabric.js 3.6.3</desc><path d="M 15.0000' +
        '00000000004 -25.980762113533157 A 30 30 0 0 1 15.000000000000004 25.' +
        '980762113533157" style="stroke: rgb(255,0,0); stroke-width: 1; strok' +
        'e-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; strok' +
        'e-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-ru' +
        'le: nonzero; opacity: 1; vector-effect: non-scaling-stroke' +
        '" id="group0"/></svg>';

      component.savedSvgDiagram = 'saved';
      component.savedSvgDiagram = sampleSVGWithGroup;
      component.continueDiagramEditing();
      tick();
      expect(component.canvas.getObjects().length).toBe(1);

      let sampleSVGWithRandomId =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
        'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 ' +
        '494 367"><desc>Created with Fabric.js 3.6.3</desc><path d="M 15.0000' +
        '00000000004 -25.980762113533157 A 30 30 0 0 1 15.000000000000004 25.' +
        '980762113533157" style="stroke: rgb(255,0,0); stroke-width: 1; strok' +
        'e-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; strok' +
        'e-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-ru' +
        'le: nonzero; opacity: 1; vector-effect: non-scaling-stroke' +
        '" id="randomId"/></svg>';

      component.savedSvgDiagram = 'saved';
      component.savedSvgDiagram = sampleSVGWithRandomId;
      component.continueDiagramEditing();
      tick();
      expect(component.canvas.getObjects().length).toBe(1);
    })
  ));

  it('should discard SVG when discard button is clicked', () => {
    spyOn(component.discardImage, 'emit');

    component.discardSvgFile();

    expect(component.discardImage.emit).toHaveBeenCalled();
  });

  it('should update diagram size when dom had loaded', waitForAsync(
    fakeAsync(() => {
      spyOnProperty(document, 'readyState').and.returnValue('loaded');
      component.ngOnInit();
      tick(100);
      component.bgPicker.onOpen();
      var WIDTH = 100;
      var HEIGHT = 100;
      component.diagramWidth = WIDTH;
      component.diagramHeight = HEIGHT;
      component.onWidthInputBlur();
      expect(component.currentDiagramWidth).toBe(WIDTH);
      component.onHeightInputBlur();
      expect(component.currentDiagramHeight).toBe(HEIGHT);
    })
  ));

  it('should reset to maximum width correctly', () => {
    component.diagramWidth = 600;
    component.onWidthInputBlur();
    expect(component.currentDiagramWidth).toBe(
      SvgEditorConstants.MAX_SVG_DIAGRAM_WIDTH
    );
  });

  it('should reset to maximum height correctly', () => {
    component.diagramHeight = 600;
    component.onHeightInputBlur();
    expect(component.currentDiagramHeight).toBe(
      SvgEditorConstants.MAX_SVG_DIAGRAM_HEIGHT
    );
  });

  it('should reset to minimum width correctly', () => {
    component.diagramWidth = 0;
    component.onWidthInputBlur();
    expect(component.currentDiagramWidth).toBe(
      SvgEditorConstants.MIN_SVG_DIAGRAM_WIDTH
    );
  });

  it('should reset to minimum height correctly', () => {
    component.diagramHeight = 0;
    component.onHeightInputBlur();
    expect(component.currentDiagramHeight).toBe(
      SvgEditorConstants.MIN_SVG_DIAGRAM_HEIGHT
    );
  });

  it('should fail svg validation', () => {
    spyOn(
      svgSanitizerService,
      'getInvalidSvgTagsAndAttrsFromDataUri'
    ).and.callFake(() => {
      return {tags: [], attrs: ['width']};
    });
    spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and.callFake(
      data => data
    );
    var invalidWidthAttribute =
      '<svg widht="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height="29" stroke="hsla' +
      '(0, 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '</svg>';
    expect(() => {
      component.isSvgTagValid(invalidWidthAttribute);
    }).toThrowError('Invalid attributes in svg:width');
  });

  it('should fail svg validation', () => {
    spyOn(
      svgSanitizerService,
      'getInvalidSvgTagsAndAttrsFromDataUri'
    ).and.callFake(() => {
      return {tags: ['script'], attrs: []};
    });
    spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and.callFake(
      data => data
    );
    var invalidSvgTag =
      '<svg width="100" height="100"><rect id="rectangle-de569866-9c11-b553-' +
      'f5b7-4194e2380d9f" x="143" y="97" width="12" height29" stroke="hsla(0' +
      ', 0%, 0%, 1)" fill="hsla(0, 0%, 100%, 1)" stroke-width="1"></rect>' +
      '<script src="evil.com"></script></svg>';
    expect(() => {
      component.isSvgTagValid(invalidSvgTag);
    }).toThrowError('Invalid tags in svg:script');
  });

  it('should check if diagram is created', () => {
    var rect = new fabric.Rect({
      top: 10,
      left: 10,
      width: 60,
      height: 70,
    });
    component.canvas.add(rect);
    expect(component.isDiagramCreated()).toBe(true);
  });

  it('should create different shapes', () => {
    component.createRect();
    component.createLine();
    component.createCircle();
    component.createText();
    expect(component.canvas.getObjects()[0].get('type')).toBe('rect');
    expect(component.canvas.getObjects()[1].get('type')).toBe('line');
    expect(component.canvas.getObjects()[2].get('type')).toBe('circle');
    expect(component.canvas.getObjects()[3].get('type')).toBe('textbox');

    component.togglePencilDrawing();
    expect(component.isPencilEnabled()).toBe(true);
    component.togglePencilDrawing();
    component.createOpenPolygon();
    expect(component.isOpenPolygonEnabled()).toBe(true);
    component.createOpenPolygon();
    component.polyOptions.lines.push(new fabric.Line([10, 10, 50, 50]));
    component.polyOptions.bboxPoints.push(new PolyPoint(10, 10));
    component.createClosedPolygon();
    expect(component.isClosedPolygonEnabled()).toBe(true);
    component.createClosedPolygon();
  });

  it('should change the order of shapes', () => {
    component.createCircle();
    component.createRect();
    expect(component.canvas.getObjects()[0].get('type')).toBe('circle');
    expect(component.canvas.getObjects()[1].get('type')).toBe('rect');
    component.canvas.setActiveObject(component.canvas.getObjects()[0]);
    component.bringObjectForward();
    expect(component.canvas.getObjects()[0].get('type')).toBe('rect');
    expect(component.canvas.getObjects()[1].get('type')).toBe('circle');
    component.sendObjectBackward();
    expect(component.canvas.getObjects()[0].get('type')).toBe('circle');
    expect(component.canvas.getObjects()[1].get('type')).toBe('rect');
  });

  it('should undo and redo the creation of shapes', () => {
    for (var i = 0; i < 6; i++) {
      component.createRect();
    }
    expect(component.canvas.getObjects().length).toBe(6);
    expect(component.isUndoEnabled()).toBe(true);
    component.onUndo();
    expect(component.canvas.getObjects().length).toBe(5);
    expect(component.isRedoEnabled()).toBe(true);
    component.onRedo();
    expect(component.canvas.getObjects().length).toBe(6);
    component.canvas.setActiveObject(component.canvas.getObjects()[5]);
    component.removeShape();
    expect(component.canvas.getObjects().length).toBe(5);
    component.onUndo();
    expect(component.canvas.getObjects().length).toBe(6);
    component.onRedo();
    expect(component.canvas.getObjects().length).toBe(5);
    expect(component.isClearEnabled()).toBe(true);
    component.onClear();
    expect(component.objectUndoStack.length).toBe(0);
  });

  it('should change properties of a shape', () => {
    component.createRect();
    component.canvas.setActiveObject(component.canvas.getObjects()[0]);
    var color = 'rgba(10, 10, 10, 1)';
    component.fabricjsOptions.stroke = color;
    component.fabricjsOptions.fill = color;
    component.fabricjsOptions.bg = color;
    component.fabricjsOptions.size = '10px';
    component.onStrokeChange();
    component.onFillChange();
    component.onBgChange();
    component.onSizeChange();
    var rectShape = component.canvas.getObjects()[0];
    expect(rectShape.get('stroke')).toBe(color);
    expect(rectShape.get('fill')).toBe(color);
    expect(component.canvas.backgroundColor).toBe(color);
    expect(rectShape.get('strokeWidth')).toBe(10);
    component.createText();
    component.canvas.discardActiveObject();
    component.canvas.setActiveObject(component.canvas.getObjects()[1]);
    component.fabricjsOptions.bold = true;
    component.fabricjsOptions.italic = true;
    component.fabricjsOptions.fontFamily = 'comic sans ms';
    component.fabricjsOptions.size = '12px';
    component.onItalicToggle();
    component.onBoldToggle();
    component.onFontChange();
    component.onSizeChange();
    var textObj = component.canvas.getObjects()[1];
    expect(textObj.get('fontStyle' as keyof fabric.Object)).toBe('italic');
    expect(textObj.get('fontWeight' as keyof fabric.Object)).toBe('bold');
    expect(textObj.get('fontFamily' as keyof fabric.Object)).toBe(
      'comic sans ms'
    );
    expect(textObj.get('fontSize' as keyof fabric.Object)).toBe(12);
  });

  it('should draw polygon using mouse events', () => {
    component.createClosedPolygon();
    component.canvas.fire('mouse:down', {
      e: {
        pageX: 0,
        pageY: 0,
      },
    });
    component.canvas.fire('mouse:move', {
      e: {
        pageX: 100,
        pageY: 100,
      },
    });
    component.canvas.fire('mouse:dblclick');
    expect(component.canvas.getObjects()[0].get('type')).toBe('polyline');
    component.createClosedPolygon();
    component.isTouchDevice = true;
    component.canvas.fire('mouse:down', {
      e: {
        pageX: 0,
        pageY: 0,
      },
    });
    component.canvas.fire('mouse:down', {
      e: {
        pageX: 10,
        pageY: 10,
      },
    });
    component.createClosedPolygon();
    expect(component.canvas.getObjects()[1].get('type')).toBe('polyline');
  });

  it('should create a bezier curve', () => {
    component.createRect();
    component.createQuadraticBezier();
    expect(component.isDrawModeBezier()).toBe(true);
    component.canvas.fire('object:moving', {
      target: {
        name: 'p0',
        left: 100,
        top: 100,
      },
    });
    component.canvas.fire('object:moving', {
      target: {
        name: 'p1',
        left: 200,
        top: 200,
      },
    });
    component.canvas.fire('object:moving', {
      target: {
        name: 'p2',
        left: 300,
        top: 300,
      },
    });
    component.onStrokeChange();
    component.onFillChange();
    component.onSizeChange();
    component.createQuadraticBezier();
    expect(component.isDrawModeBezier()).toBe(false);
    expect(
      component.canvas.getObjects()[1].get('path' as keyof fabric.Object)
    ).toEqual([
      ['M', 100, 100],
      ['Q', 200, 200, 300, 300],
    ]);
    expect(component.canvas.getObjects()[1].get('type')).toBe('path');
  });

  it('should create a pie chart', () => {
    component.createPieChart();
    expect(component.isPieChartEnabled()).toBe(true);
    expect(component.isDrawModePieChart()).toBe(true);
    component.onAddItem();
    component.pieChartDataInput[2].data = 100;
    component.createPieChart();
    expect(component.isDrawModePieChart()).toBe(false);
  });

  it('should upload an svg file', () => {
    var fileContent =
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjA' +
      'wMC9zdmciICB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5' +
      'PSI1MCIgcj0iNDAiIHN0cm9rZT0iZ3JlZW4iIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ie' +
      'WVsbG93IiAvPjwvc3ZnPg==';
    component.uploadSvgFile();
    expect(component.isSvgUploadEnabled()).toBe(true);
    expect(component.isDrawModeSvgUpload()).toBe(true);
    var file = new File([fileContent], 'circle.svg', {type: 'image/svg'});
    component.onFileChanged(file, 'circle.svg');
    component.uploadedSvgDataUrl = {
      safeUrl: fileContent,
      unsafeUrl: fileContent,
    };
    expect(component.isFileUploaded()).toBe(true);
    component.uploadSvgFile();
    expect(component.canvas.getObjects()[0].get('type')).toBe('group');
    component.canvas.setActiveObject(component.canvas.getObjects()[0]);
    expect(component.displayFontStyles).toBe(false);
    component.uploadSvgFile();
    expect(component.isDrawModeSvgUpload()).toBe(true);
    var file = new File([fileContent], 'circle.svg', {type: 'image/svg'});
    component.onFileChanged(file, 'circle.svg');
    component.uploadedSvgDataUrl = {
      safeUrl: fileContent,
      unsafeUrl: fileContent,
    };
    expect(component.isFileUploaded()).toBe(true);
    component.loadType = 'nogroup';
    component.uploadSvgFile();
    expect(component.canvas.getObjects()[1].get('type')).toBe('circle');
  });

  it('should set title with onOpen color picker function', waitForAsync(() => {
    const domReady = new Promise((resolve, reject) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve(0);
      }
    });
    domReady.then(() => {
      fixture.detectChanges();
      component.bgPicker.onOpen();
      let alphaSliders = document.querySelectorAll(
        '.picker_alpha .picker_selector'
      );
      alphaSliders.forEach(element => {
        expect(element.getAttribute('title')).toBe('Transparency Slider');
      });
    });
  }));

  it('should trigger object selection and scaling events', () => {
    component.createRect();
    component.createText();
    component.canvas.setActiveObject(component.canvas.getObjects()[0]);
    component.canvas.setActiveObject(component.canvas.getObjects()[1]);
    expect(component.isSizeVisible()).toBe(true);
    expect(component.displayFontStyles).toBe(true);
    component.canvas.fire('object:scaling');
    expect(component.canvas.getObjects()[1].get('scaleX')).toBe(1);
    expect(component.canvas.getObjects()[1].get('scaleY')).toBe(1);
  });

  it('should save svg file created by the editor', waitForAsync(
    fakeAsync(() => {
      component.createText();
      spyOn(svgFileFetcherBackendApiService, 'postSvgFile').and.callFake(() => {
        return of({filename: 'imageFile1.svg'});
      });
      component.saveSvgFile();
      tick(1);
      fixture.detectChanges();
      tick(1);
      expect(component.data.savedSvgFileName).toBe('imageFile1.svg');
      expect(component.data.savedSvgUrl.toString()).toBe(dataUrl);
      expect(component.validate()).toBe(true);
    })
  ));

  it('should not save svg file when no diagram is created', () => {
    component.saveSvgFile();
    expect(alertSpy).toHaveBeenCalledWith('Custom Diagram not created.');
  });

  it('should handle rejection when saving an svg file fails', waitForAsync(
    fakeAsync(() => {
      component.createRect();
      var errorMessage = 'Image exceeds file size limit of 100 KB.';
      spyOn(component, 'postSvgToServer').and.callFake(() => {
        return Promise.reject({error: {error: errorMessage}});
      });
      component.saveSvgFile();
      tick(1);
      fixture.detectChanges();
      tick(1);
      expect(alertSpy).toHaveBeenCalledWith(errorMessage);
    })
  ));

  it('should allow user to continue editing the diagram when dom loaded', waitForAsync(
    fakeAsync(() => {
      spyOnProperty(document, 'readyState').and.returnValue('loaded');
      component.savedSvgDiagram = 'saved';
      component.savedSvgDiagram = samplesvg;
      component.continueDiagramEditing();
      tick(100);
      var mocktoSVG = arg => {
        return '<path></path>';
      };
      var customToSVG = component.createCustomToSVG(
        mocktoSVG as () => string,
        'path',
        'group1',
        component
      );
      expect(customToSVG()).toBe('<path id="group1"/>');
      expect(component.diagramStatus).toBe('editing');
    })
  ));

  it(
    'should wait for the dom to load before allowing the user to continue ' +
      'editing the diagram',
    waitForAsync(
      fakeAsync(() => {
        spyOnProperty(document, 'readyState').and.returnValue('loading');
        spyOn(document, 'addEventListener').and.callFake(
          (eventName, handler) => {
            setTimeout(() => handler());
          }
        );
        component.savedSvgDiagram = 'saved';
        component.savedSvgDiagram = samplesvg;
        component.continueDiagramEditing();
        tick(10);
        var mocktoSVG = arg => {
          return '<path></path>';
        };
        var customToSVG = component.createCustomToSVG(
          mocktoSVG as () => string,
          'path',
          'group1',
          component
        );
        expect(customToSVG()).toBe('<path id="group1"/>');
        expect(component.diagramStatus).toBe('editing');
      })
    )
  );
});

describe('SvgEditor initialized with value attribute', () => {
  var component: SvgEditorComponent;
  var contextService: ContextService;
  let svgSanitizerService: SvgSanitizerService;
  let imageLocalStorageService: ImageLocalStorageService;
  var samplesvg =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
    'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 494' +
    ' 367"><desc>Created with Fabric.js 3.6.3</desc><rect x="0" y="0" ' +
    'width="100%" height="100%" fill="rgba(10,245,49,0.607)"/></svg>';
  var mockAssetsBackendApiService = {
    getImageUrlForPreview: (contentType, contentId, filepath) => {
      return '/imageurl_' + contentType + '_' + contentId + '_' + filepath;
    },
  };
  var mockImagePreloaderService = {
    getDimensionsOfImage: () => {
      return {
        width: 450,
        height: 350,
      };
    },
  };
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SvgEditorComponent],
      providers: [
        {
          provide: AssetsBackendApiService,
          useValue: mockAssetsBackendApiService,
        },
        {
          provide: ImagePreloaderService,
          useValue: mockImagePreloaderService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    component = TestBed.createComponent(SvgEditorComponent).componentInstance;
    component.value = 'svgimageFilename1.svg';
    contextService = TestBed.inject(ContextService);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    const svgFileFetcherBackendApiService: SvgFileFetcherBackendApiService =
      TestBed.inject(SvgFileFetcherBackendApiService);
    spyOn(svgFileFetcherBackendApiService, 'fetchSvg').and.returnValue(
      of(samplesvg)
    );
    initializeMockDocument(component);
  }));

  it('should load the svg file', waitForAsync(
    fakeAsync(() => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('1');
      component.ngOnInit();
      tick(10);
      expect(component.diagramStatus).toBe('saved');
      expect(component.savedSvgDiagram).toBe(samplesvg);
    })
  ));

  it('should handle previously uploaded svg diagram correctly', waitForAsync(
    fakeAsync(() => {
      spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl');
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      let dataUrl =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcv';
      spyOn(imageLocalStorageService, 'getRawImageData').and.returnValue(
        dataUrl
      );
      component.value = 'svgimageFilename1.svg';
      component.ngOnInit();
      tick(10);
      expect(svgSanitizerService.getTrustedSvgResourceUrl).toHaveBeenCalledWith(
        dataUrl
      );
    })
  ));
});

describe('SvgEditor with image save destination as local storage', () => {
  var contextService: ContextService;
  let fixture: ComponentFixture<SvgEditorComponent>;
  var component: SvgEditorComponent = null;
  var samplesvg =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.or' +
    'g/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 494' +
    ' 367"><desc>Created with Fabric.js 3.6.3</desc><rect x="0" y="0" ' +
    'width="100%" height="100%" fill="rgba(10,245,49,0.607)"/></svg>';
  var dataUrl = 'data:image/svg+xml;utf8,' + samplesvg;

  var mockilss = {
    getRawImageData: filename => {
      return dataUrl;
    },
    saveImage: (filename, imageData) => {
      return 'Image file save.';
    },
    deleteImage: filename => {
      return 'Image file is deleted.';
    },
    isInStorage: filename => {
      return true;
    },
  };

  var mockImageUploadHelperService = {
    convertImageDataToImageFile: svgDataUri => {
      return new Blob();
    },
    generateImageFilename: (height, widht, extension) => {
      return height + '_' + widht + '.' + extension;
    },
  };

  var mockSvgSanitizerService = {
    getInvalidSvgTagsAndAttrsFromDataUri: dataUri => {
      return {tags: [], attrs: []};
    },
    getTrustedSvgResourceUrl: data => {
      return data;
    },
  };

  var mockImagePreloaderService = {
    getDimensionsOfImage: () => {
      return {
        width: 450,
        height: 350,
      };
    },
  };

  class mockReaderObject {
    result = null;
    onload = null;
    constructor() {
      this.onload = () => {
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
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    set src(url) {
      this.onload();
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SvgEditorComponent],
      providers: [
        {
          provide: AssetsBackendApiService,
          useValue: {},
        },
        {
          provide: ImageLocalStorageService,
          useValue: mockilss,
        },
        {
          provide: ImagePreloaderService,
          useValue: mockImagePreloaderService,
        },
        {
          provide: ImageUploadHelperService,
          useValue: mockImageUploadHelperService,
        },
        {
          provide: SvgSanitizerService,
          useValue: mockSvgSanitizerService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    contextService = TestBed.inject(ContextService);
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
    );
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');

    // This throws "Argument of type 'mockImageObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this error
    // because 'HTMLImageElement' has around 250 more properties. We have only
    // defined the properties we need in 'mockImageObject'.
    // @ts-expect-error
    spyOn(window, 'Image').and.returnValue(new mockImageObject());
    // This throws "Argument of type 'mockReaderObject' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only
    // defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());
    fixture = TestBed.createComponent(SvgEditorComponent);
    component = fixture.componentInstance;
    initializeMockDocument(component);
    component.ngOnInit();
    component.canvas = new fabric.Canvas(component.canvasID);
    component.initializeMouseEvents();
  }));

  it('should save svg file to local storage created by the svg editor', () => {
    component.createRect();
    component.saveSvgFile();
    expect(component.data.savedSvgFileName).toBe('350_450.svg');
    expect(component.data.savedSvgUrl.toString()).toBe(dataUrl);
    expect(component.validate()).toBe(true);
  });

  it(
    'should allow user to continue editing the diagram and delete the ' +
      'image from local storage',
    () => {
      component.data.savedSvgFileName = 'image.svg';
      component.savedSvgDiagram = 'saved';
      component.savedSvgDiagram = samplesvg;
      component.continueDiagramEditing();
      expect(component.diagramStatus).toBe('editing');
    }
  );
});
