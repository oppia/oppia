// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for image with regions editor.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {ImageWithRegionsEditorComponent} from './image-with-regions-editor.component';
import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ContextService} from 'services/context.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ImageWithRegionsResetConfirmationModalComponent} from './image-with-regions-reset-confirmation.component';
import {AppConstants} from 'app.constants';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('ImageWithRegionsEditorComponent', () => {
  let component: ImageWithRegionsEditorComponent;
  let ngbModal: NgbModal;
  let fixture: ComponentFixture<ImageWithRegionsEditorComponent>;
  let contextService: ContextService;
  let imageLocalStorageService: ImageLocalStorageService;
  let assetsBackendApiService: AssetsBackendApiService;
  let svgSanitizerService: SvgSanitizerService;

  class MockWindowRef {
    nativeWindow = {
      scrollX: 0,
      scrollY: 0,
    };
  }

  class MockImageObject {
    source = null;
    onload!: () => string;
    width = 0;
    height = 0;
    constructor(_width: 0, _height: 0) {
      this.width = _width;
      this.height = _height;
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    set src(url: string) {
      this.onload();
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ImageWithRegionsEditorComponent],
      providers: [
        ContextService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    contextService = TestBed.inject(ContextService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    fixture = TestBed.createComponent(ImageWithRegionsEditorComponent);
    component = fixture.componentInstance;

    component.value = {
      imagePath: 'img_20210627_214959_mwljsqraka_height_691_width_392.svg',
      labeledRegions: [
        {
          label: 'Region1',
          region: {
            regionType: 'Rectangle',
            area: [
              [0.23225103021579202, 0.08157179492961315],
              [0.553006091537647, 0.3235816208679242],
            ],
          },
        },
        {
          label: 'Region2',
          region: {
            regionType: 'Rectangle',
            area: [
              [0.2757432419204503, 0.45691824471291725],
              [0.8751202844752727, 0.69045001942409],
            ],
          },
        },
      ],
    };
    // This throws "Argument of type 'mockImageObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockImageObject'.
    // @ts-expect-error
    spyOn(window, 'Image').and.returnValue(new MockImageObject(490, 864));
  });

  it('should initialize editor when ngOnChanges is run with a new value only', fakeAsync(() => {
    expect(component.editorIsInitialized).toBe(false);
    spyOn(component, 'imageValueChanged').and.callThrough();
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION
    );
    spyOn(contextService, 'getEntityId').and.returnValue('skill_1');
    component.ngOnChanges({});
    expect(component.editorIsInitialized).toBe(false);
    component.ngOnChanges({
      value: new SimpleChange(
        undefined,
        {labeledRegion: [], imagePath: ''},
        true
      ),
    });
    expect(component.editorIsInitialized).toBe(true);
    expect(component.imageValueChanged).toHaveBeenCalled();
  }));

  it('should not re-initialize editor once initialized', fakeAsync(() => {
    expect(component.editorIsInitialized).toBe(false);
    component.initializeEditor();
    expect(component.editorIsInitialized).toBe(true);
    component.initializeEditor();
    expect(component.editorIsInitialized).toBe(true);
  }));

  it('should initialize component when interaction editor is opened.', () => {
    spyOn(component, 'initializeEditor').and.callThrough();
    spyOn(component, 'imageValueChanged').and.callThrough();
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION
    );
    spyOn(contextService, 'getEntityId').and.returnValue('skill_1');
    spyOn(contextService, 'getExplorationId').and.returnValue('exploration_id');
    spyOn(component.valueChanged, 'emit');
    spyOn(component, 'getPreviewUrl');

    component.ngOnInit();

    expect(component.alwaysEditable).toBe(true);
    expect(component.SCHEMA).toEqual({
      type: 'custom',
      obj_type: 'Filepath',
    });
    // Testing values initialised in initializeEditor function.
    expect(component.initializeEditor).toHaveBeenCalled();
    expect(component.mouseX).toBe(0);
    expect(component.mouseY).toBe(0);
    expect(component.originalMouseX).toBe(0);
    expect(component.originalMouseY).toBe(0);
    expect(component.originalRectArea).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    expect(component.rectX).toBe(0);
    expect(component.rectY).toBe(0);
    expect(component.rectWidth).toBe(0);
    expect(component.rectHeight).toBe(0);
    expect(component.userIsCurrentlyDrawing).toBe(false);
    expect(component.userIsCurrentlyDragging).toBe(false);
    expect(component.userIsCurrentlyResizing).toBe(false);
    expect(component.xDirection).toBe(0);
    expect(component.yDirection).toBe(0);
    expect(component.yDirectionToggled).toBe(false);
    expect(component.xDirectionToggled).toBe(false);
    expect(component.movedOutOfRegion).toBe(false);
    expect(component.resizableBorderWidthPx).toBe(10);
    expect(component.hoveredRegion).toBeNull();
    expect(component.selectedRegion).toBeNull();
    expect(component.errorText).toBe('');
    // Testing values initalised in the imageValueChanged function.
    expect(component.imageValueChanged).toHaveBeenCalled();
    expect(component.originalImageWidth).toBe(490);
    expect(component.originalImageHeight).toBe(864);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  });

  it(
    'should initialize component when interaction editor is opened with a' +
      ' custom entity context',
    () => {
      spyOn(component, 'initializeEditor').and.callThrough();
      spyOn(component, 'imageValueChanged').and.callThrough();
      spyOn(contextService, 'getEntityType').and.returnValue(
        AppConstants.IMAGE_CONTEXT.QUESTION_SUGGESTIONS
      );
      spyOn(contextService, 'getEntityId').and.returnValue('skill_1');
      spyOn(component.valueChanged, 'emit');

      component.ngOnInit();

      expect(component.alwaysEditable).toBe(true);
      expect(component.SCHEMA).toEqual({
        type: 'custom',
        obj_type: 'Filepath',
      });
      // Testing values initialised in initializeEditor function.
      expect(component.initializeEditor).toHaveBeenCalled();
      expect(component.mouseX).toBe(0);
      expect(component.mouseY).toBe(0);
      expect(component.originalMouseX).toBe(0);
      expect(component.originalMouseY).toBe(0);
      expect(component.originalRectArea).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expect(component.rectX).toBe(0);
      expect(component.rectY).toBe(0);
      expect(component.rectWidth).toBe(0);
      expect(component.rectHeight).toBe(0);
      expect(component.userIsCurrentlyDrawing).toBe(false);
      expect(component.userIsCurrentlyDragging).toBe(false);
      expect(component.userIsCurrentlyResizing).toBe(false);
      expect(component.xDirection).toBe(0);
      expect(component.yDirection).toBe(0);
      expect(component.yDirectionToggled).toBe(false);
      expect(component.xDirectionToggled).toBe(false);
      expect(component.movedOutOfRegion).toBe(false);
      expect(component.resizableBorderWidthPx).toBe(10);
      expect(component.hoveredRegion).toBeNull();
      expect(component.selectedRegion).toBeNull();
      expect(component.errorText).toBe('');
      // Testing values initalised in the imageValueChanged function.
      expect(component.imageValueChanged).toHaveBeenCalled();
      expect(component.originalImageWidth).toBe(490);
      expect(component.originalImageHeight).toBe(864);
      expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    }
  );

  it(
    'should initialize component when interaction editor is opened with a' +
      ' the image destination set to local storage',
    () => {
      spyOn(component, 'initializeEditor').and.callThrough();
      spyOn(component, 'imageValueChanged').and.callThrough();
      spyOn(contextService, 'getEntityType').and.returnValue(
        AppConstants.IMAGE_CONTEXT.QUESTION_SUGGESTIONS
      );
      spyOn(contextService, 'getEntityId').and.returnValue('skill_1');
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      spyOn(component.valueChanged, 'emit');
      spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
      spyOn(imageLocalStorageService, 'getRawImageData').and.returnValue('abc');

      component.ngOnInit();

      expect(component.alwaysEditable).toBe(true);
      expect(component.SCHEMA).toEqual({
        type: 'custom',
        obj_type: 'Filepath',
      });
      // Testing values initialised in initializeEditor function.
      expect(component.initializeEditor).toHaveBeenCalled();
      expect(component.mouseX).toBe(0);
      expect(component.mouseY).toBe(0);
      expect(component.originalMouseX).toBe(0);
      expect(component.originalMouseY).toBe(0);
      expect(component.originalRectArea).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expect(component.rectX).toBe(0);
      expect(component.rectY).toBe(0);
      expect(component.rectWidth).toBe(0);
      expect(component.rectHeight).toBe(0);
      expect(component.userIsCurrentlyDrawing).toBe(false);
      expect(component.userIsCurrentlyDragging).toBe(false);
      expect(component.userIsCurrentlyResizing).toBe(false);
      expect(component.xDirection).toBe(0);
      expect(component.yDirection).toBe(0);
      expect(component.yDirectionToggled).toBe(false);
      expect(component.xDirectionToggled).toBe(false);
      expect(component.movedOutOfRegion).toBe(false);
      expect(component.resizableBorderWidthPx).toBe(10);
      expect(component.hoveredRegion).toBeNull();
      expect(component.selectedRegion).toBeNull();
      expect(component.errorText).toBe('');
      // Testing values initalised in the imageValueChanged function.
      expect(component.imageValueChanged).toHaveBeenCalled();
      expect(component.originalImageWidth).toBe(490);
      expect(component.originalImageHeight).toBe(864);
      expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    }
  );

  // For the following tests Pre-Checks cannot be added because a state change
  // does not occur within these functions. They just return css styling for
  // various components of the region.
  it(
    'should return selected region css styling for the rectangle' +
      ' when a region is selected',
    () => {
      component.selectedRegion = 0;

      expect(component.getRegionStyle(0)).toBe(
        'fill: #00f; opacity: 0.5; stroke: #00d'
      );
    }
  );

  it(
    'should return default region css styling for the rectangle' +
      ' when a region is not selected',
    () => {
      component.selectedRegion = 0;

      expect(component.getRegionStyle(1)).toBe(
        'fill: white; opacity: 0.5; stroke: #ddd'
      );
    }
  );

  it(
    'should return selected region trash icon css styling' +
      ' when a region is selected',
    () => {
      component.selectedRegion = 0;

      expect(component.getRegionTrashStyle(0)).toBe('fill: #eee; opacity: 0.7');
    }
  );

  it(
    'should return default trash icon css styling for the trash icon' +
      ' when a region is not selected',
    () => {
      component.selectedRegion = 0;

      expect(component.getRegionTrashStyle(1)).toBe('fill: #333; opacity: 0.7');
    }
  );

  it(
    'should return region label css styling for a selected region' +
      ' when a region is selected',
    () => {
      component.selectedRegion = 0;

      expect(component.getRegionLabelStyle(0)).toBe(
        'font-size: 14px; pointer-events: none; fill: #eee; visibility: hidden;'
      );
    }
  );

  it(
    'should return default label css styling for other regions' +
      ' when a region is not selected',
    () => {
      component.selectedRegion = 0;

      expect(component.getRegionLabelStyle(1)).toBe(
        'font-size: 14px; pointer-events: none; fill: ' +
          '#333; visibility: visible;'
      );
    }
  );

  it(
    'should return region label text input css styling for a selected region' +
      ' when a region is selected',
    () => {
      spyOn(component, 'getRegionStyle').and.callThrough();
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      component.selectedRegion = 0;
      component.originalImageWidth = 490;
      component.originalImageHeight = 864;

      expect(component.getRegionLabelEditorStyle()).toBe(
        'left: 119.80300480573808px; top: 96.47803081918576px;' +
          ' width: 145.16998004770895px;'
      );
    }
  );

  it(
    'should return default label css styling for other regions' +
      ' when no region is selected',
    () => {
      component.selectedRegion = null;

      expect(component.getRegionLabelEditorStyle()).toBe('display: none');
    }
  );

  it('should set region label when user enter a label for a region', () => {
    component.selectedRegion = null;
    component.selectedRegion = 0;
    component.errorText = '';

    expect(component.value.labeledRegions[0].label).toBe('Region1');

    component.regionLabelSetter('new region 1');

    expect(component.value.labeledRegions[0].label).toBe('new region 1');
    // The error text value should not change since there is no error present.
    expect(component.errorText).toBe('');
  });

  it('should warn if user when user enters a duplicate label', () => {
    component.selectedRegion = null;
    component.selectedRegion = 0;
    component.errorText = '';

    expect(component.value.labeledRegions[0].label).toBe('Region1');

    component.regionLabelSetter('Region2');

    expect(component.value.labeledRegions[0].label).toBe('Region2');
    expect(component.errorText).toBe(
      'Warning: Label "Region2" already ' +
        'exists! Please use a different label.'
    );
  });

  it('should get dimenions of region when user is drawing the region', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and.returnValue([
        {
          getBoundingClientRect: () => {
            return {
              bottom: 1468.6285400390625,
              height: 1297.46533203125,
              left: 477.1180725097656,
              right: 1212.8819885253906,
              top: 171.1632080078125,
              width: 735.763916015625,
              x: 477.1180725097656,
              y: 171.1632080078125,
            };
          },
        },
      ])
    );
    spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(500);
    spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(400);
    let evt = new MouseEvent('Mousemove');
    component.userIsCurrentlyDrawing = true;
    component.originalMouseX = 200;
    component.originalMouseY = 200;

    component.onSvgMouseMove(evt);

    expect(component.mouseX).toBe(22.881927490234375);
    expect(component.mouseY).toBe(228.8367919921875);
    expect(component.rectX).toBe(22.881927490234375);
    expect(component.rectY).toBe(200);
    expect(component.rectWidth).toBe(177.11807250976562);
    expect(component.rectHeight).toBe(28.8367919921875);
  });

  it(
    'should get new location of region when user is dragging the' +
      ' region diagonally down',
    () => {
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(700);
      spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(600);
      let evt = new MouseEvent('Mousemove');
      component.userIsCurrentlyDragging = true;
      component.originalMouseX = 500;
      component.originalMouseY = 500;
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.selectedRegion = 0;
      component.originalRectArea = {
        x: 113.80300480573808,
        y: 70.47803081918576,
        width: 157.16998004770895,
        height: 209.09648961070076,
      };
      spyOn(component, 'getImageWidth').and.callThrough();
      spyOn(component, 'getImageHeight').and.callThrough();
      expect(component.value.labeledRegions[0].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.23225103021579202, 0.08157179492961315],
          [0.553006091537647, 0.3235816208679242],
        ],
      });
      component.onSvgMouseMove(evt);

      expect(component.value.labeledRegions[0].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0, 0],
          [0.21361468893287125, 0.16115734093948267],
        ],
      });
    }
  );

  it(
    'should get new location of region when user is dragging the' +
      ' region diagonally up',
    () => {
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(2000);
      spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(1707);
      let evt = new MouseEvent('Mousemove');
      component.userIsCurrentlyDragging = true;
      component.originalMouseX = 500;
      component.originalMouseY = 500;
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.selectedRegion = 0;
      component.originalRectArea = {
        x: 113.80300480573808,
        y: 70.47803081918576,
        width: 157.16998004770895,
        height: 209.09648961070076,
      };
      spyOn(component, 'getImageWidth').and.callThrough();
      spyOn(component, 'getImageHeight').and.callThrough();
      expect(component.value.labeledRegions[0].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.23225103021579202, 0.08157179492961315],
          [0.553006091537647, 0.3235816208679242],
        ],
      });

      component.onSvgMouseMove(evt);

      expect(component.value.labeledRegions[0].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.7863853110671288, 0.8388426590605174],
          [1, 1],
        ],
      });
    }
  );

  it(
    'should increase the hight (top) and width (left) of the region ' +
      'when user is resizing the region',
    () => {
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(600);
      spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(400);
      let evt = new MouseEvent('Mousemove');
      component.userIsCurrentlyDrawing = false;
      component.userIsCurrentlyDragging = false;
      component.userIsCurrentlyResizing = true;
      component.originalMouseX = 200;
      component.originalMouseY = 200;
      component.selectedRegion = 0;
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.originalRectArea = {
        x: 113.80300480573808,
        y: 70.47803081918576,
        width: 157.16998004770895,
        height: 209.09648961070076,
      };
      component.yDirectionToggled = true;
      component.xDirectionToggled = true;
      component.yDirection = 1;
      component.xDirection = 1;

      expect(component.value.labeledRegions[0].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.23225103021579202, 0.08157179492961315],
          [0.553006091537647, 0.3235816208679242],
        ],
      });

      component.onSvgMouseMove(evt);

      expect(component.yDirectionToggled).toBe(false);
      expect(component.xDirectionToggled).toBe(false);
      expect(component.value.labeledRegions[0].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.04985965130585909, 0.0765451050371804],
          [0.36828795073404025, 0.21547700963701794],
        ],
      });
    }
  );

  it(
    'should increase the hight (bottom) and width (right) of the region ' +
      'when user is resizing the region',
    () => {
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(600);
      spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(200);
      let evt = new MouseEvent('Mousemove');
      component.userIsCurrentlyDrawing = false;
      component.userIsCurrentlyDragging = false;
      component.userIsCurrentlyResizing = true;
      component.originalMouseX = 500;
      component.originalMouseY = 500;
      component.selectedRegion = 1;
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.originalRectArea = {
        x: 113.80300480573808,
        y: 70.47803081918576,
        width: 157.16998004770895,
        height: 209.09648961070076,
      };
      component.yDirectionToggled = false;
      component.xDirectionToggled = false;
      component.yDirection = -1;
      component.xDirection = -1;

      expect(component.value.labeledRegions[1].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.2757432419204503, 0.45691824471291725],
          [0.8751202844752727, 0.69045001942409],
        ],
      });

      component.onSvgMouseMove(evt);

      expect(component.yDirectionToggled).toBe(true);
      expect(component.xDirectionToggled).toBe(true);
      expect(component.value.labeledRegions[1].region).toEqual({
        regionType: 'Rectangle',
        area: [
          [0.16701271265880457, 0.022225436339645178],
          [0.46595111895241487, 0.22420862393043944],
        ],
      });
    }
  );

  it('should start drawing region when user clicks mouse down', () => {
    let evt = document.createEvent('MouseEvent');
    evt.initMouseEvent(
      'click',
      true,
      true,
      window,
      1,
      800,
      600,
      500,
      400,
      false,
      false,
      false,
      false,
      0,
      null
    );
    component.mouseX = 500;
    component.mouseY = 400;
    component.hoveredRegion = null;
    component.rectHeight = 10;
    component.rectWidth = 10;
    component.originalMouseX = 0;
    component.originalMouseY = 0;
    component.userIsCurrentlyDragging = false;

    component.onSvgMouseDown(evt);

    expect(component.rectWidth).toBe(0);
    expect(component.rectHeight).toBe(0);
    expect(component.originalMouseX).toBe(500);
    expect(component.originalMouseY).toBe(400);
    expect(component.userIsCurrentlyDrawing).toBe(true);
  });

  it("should reset variables when user's mouse moves out of region", () => {
    component.hoveredRegion = null;
    component.selectedRegion = 1;
    component.userIsCurrentlyDragging = true;
    component.userIsCurrentlyResizing = true;
    component.movedOutOfRegion = true;
    component.xDirection = 1;
    component.yDirection = 1;
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION
    );
    spyOn(contextService, 'getExplorationId').and.returnValue('exploration_id');

    component.onSvgMouseUp();

    expect(component.selectedRegion).toBe(null);
    expect(component.xDirection).toBe(0);
    expect(component.yDirection).toBe(0);
    expect(component.userIsCurrentlyDragging).toBe(false);
    expect(component.userIsCurrentlyResizing).toBe(false);
    expect(component.movedOutOfRegion).toBe(false);
  });

  it('should insert region when user releases mouse button', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and.returnValue([
        {
          getBoundingClientRect: () => {
            return {
              bottom: 1468.6285400390625,
              height: 1297.46533203125,
              left: 477.1180725097656,
              right: 1212.8819885253906,
              top: 171.1632080078125,
              width: 735.763916015625,
              x: 477.1180725097656,
              y: 171.1632080078125,
            };
          },
        },
      ])
    );
    component.xDirectionToggled = true;
    component.yDirectionToggled = true;
    component.userIsCurrentlyDrawing = true;
    component.xDirection = 0;
    component.yDirection = 0;
    component.rectX = 250;
    component.rectY = 350;
    component.rectWidth = 260;
    component.rectHeight = 360;
    component.originalImageWidth = 968;
    component.originalImageHeight = 1707;

    expect(component.value.labeledRegions).toEqual([
      {
        label: 'Region1',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.23225103021579202, 0.08157179492961315],
            [0.553006091537647, 0.3235816208679242],
          ],
        },
      },
      {
        label: 'Region2',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.2757432419204503, 0.45691824471291725],
            [0.8751202844752727, 0.69045001942409],
          ],
        },
      },
    ]);

    component.onSvgMouseUp();

    expect(component.yDirection).toBe(1);
    expect(component.xDirection).toBe(1);
    expect(component.value.labeledRegions).toEqual([
      {
        label: 'Region1',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.23225103021579202, 0.08157179492961315],
            [0.553006091537647, 0.3235816208679242],
          ],
        },
      },
      {
        label: 'Region2',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.2757432419204503, 0.45691824471291725],
            [0.8751202844752727, 0.69045001942409],
          ],
        },
      },
      {
        label: 'Region3',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.33978290394264304, 0.2697561754089455],
            [0.6931571240429918, 0.5472196701152894],
          ],
        },
      },
    ]);
    expect(component.userIsCurrentlyDrawing).toBe(false);
    expect(component.yDirectionToggled).toBe(false);
    expect(component.xDirectionToggled).toBe(false);
  });

  it(
    'should check if mouse is over region when user moves mouse over' +
      ' a region',
    () => {
      component.hoveredRegion = null;
      component.movedOutOfRegion = true;

      component.onMouseoverRegion(1);

      expect(component.hoveredRegion).toBe(1);
      expect(component.movedOutOfRegion).toBe(false);
    }
  );

  it(
    'should reset values if user is not hovering over a region' +
      ' and is not resizing',
    () => {
      component.hoveredRegion = 1;
      component.userIsCurrentlyResizing = false;
      component.xDirection = 1;
      component.yDirection = 1;
      component.movedOutOfRegion = false;

      component.onMouseoutRegion(1);

      expect(component.hoveredRegion).toBeNull();
      expect(component.xDirection).toBe(0);
      expect(component.yDirection).toBe(0);
      expect(component.movedOutOfRegion).toBe(true);
    }
  );

  it('should not reset values if user is resizing', () => {
    component.hoveredRegion = 1;
    component.userIsCurrentlyResizing = false;
    component.xDirection = 1;
    component.yDirection = 1;
    component.movedOutOfRegion = false;

    component.onMouseoutRegion(1);

    expect(component.hoveredRegion).toBeNull();
    expect(component.movedOutOfRegion).toBe(true);
    // Only the values given below must not change if the user is resizing.
    expect(component.xDirection).toBe(0);
    expect(component.yDirection).toBe(0);
  });

  it('should set start resizing when user clicks mouse down', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and.returnValue([
        {
          getBoundingClientRect: () => {
            return {
              bottom: 1468.6285400390625,
              height: 1297.46533203125,
              left: 477.1180725097656,
              right: 1212.8819885253906,
              top: 171.1632080078125,
              width: 735.763916015625,
              x: 477.1180725097656,
              y: 171.1632080078125,
            };
          },
        },
      ])
    );
    component.originalImageWidth = 968;
    component.originalImageHeight = 1707;
    component.xDirection = 1;
    component.hoveredRegion = 1;
    component.userIsCurrentlyResizing = false;
    component.selectedRegion = null;

    component.onMousedownRegion();

    expect(component.userIsCurrentlyResizing).toBe(true);
    expect(component.selectedRegion).toBe(1);
    expect(component.originalRectArea).toEqual({
      x: 202.88192749023438,
      y: 592.8367919921875,
      width: 441,
      height: 303,
    });
  });

  it('should set start dragging when user clicks mouse down', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and.returnValue([
        {
          getBoundingClientRect: () => {
            return {
              bottom: 1468.6285400390625,
              height: 1297.46533203125,
              left: 477.1180725097656,
              right: 1212.8819885253906,
              top: 171.1632080078125,
              width: 735.763916015625,
              x: 477.1180725097656,
              y: 171.1632080078125,
            };
          },
        },
      ])
    );
    component.originalImageWidth = 968;
    component.originalImageHeight = 1707;
    component.hoveredRegion = 1;
    component.userIsCurrentlyDragging = false;
    component.selectedRegion = null;

    component.onMousedownRegion();

    expect(component.xDirection).toBeUndefined();
    expect(component.yDirection).toBeUndefined();
    // The above 2 validations make sure that the if statement for
    // resizing the region doesn't execute.
    expect(component.userIsCurrentlyDragging).toBe(true);
    expect(component.selectedRegion).toBe(1);
    expect(component.originalRectArea).toEqual({
      x: 202.88192749023438,
      y: 592.8367919921875,
      width: 441,
      height: 303,
    });
  });

  it(
    'should make sure that the user cannot resize or drag the region' +
      ' while editing the region label',
    () => {
      component.userIsCurrentlyDragging = true;
      component.userIsCurrentlyResizing = true;

      component.regionLabelEditorMouseUp();

      expect(component.userIsCurrentlyDragging).toBe(false);
      expect(component.userIsCurrentlyResizing).toBe(false);
    }
  );

  it(
    "should reset editor when user clicks 'Clear Image and Regions'" +
      ' editor',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve('success'),
      } as NgbModalRef);
      spyOn(component, 'imageValueChanged');
      spyOn(component, 'initializeEditor');

      expect(component.value).toEqual({
        imagePath: 'img_20210627_214959_mwljsqraka_height_691_width_392.svg',
        labeledRegions: [
          {
            label: 'Region1',
            region: {
              regionType: 'Rectangle',
              area: [
                [0.23225103021579202, 0.08157179492961315],
                [0.553006091537647, 0.3235816208679242],
              ],
            },
          },
          {
            label: 'Region2',
            region: {
              regionType: 'Rectangle',
              area: [
                [0.2757432419204503, 0.45691824471291725],
                [0.8751202844752727, 0.69045001942409],
              ],
            },
          },
        ],
      });

      component.resetEditor();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(
        ImageWithRegionsResetConfirmationModalComponent,
        {
          backdrop: 'static',
          keyboard: false,
        }
      );
      expect(component.value).toEqual({
        imagePath: '',
        labeledRegions: [],
      });
      expect(component.imageValueChanged).toHaveBeenCalled();
      expect(component.initializeEditor).toHaveBeenCalled();
    })
  );

  it("should reset editor when user clicks 'cancel'" + ' in the modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject('failure'),
    } as NgbModalRef);
    spyOn(component, 'imageValueChanged');
    spyOn(component, 'initializeEditor');

    component.resetEditor();

    // Note to developers:
    // This callback is triggered when the Cancel button is clicked.
    // No further action is needed.
    expect(component.imageValueChanged).not.toHaveBeenCalled();
    expect(component.initializeEditor).not.toHaveBeenCalled();
  });

  it('should get schema when function is called', () => {
    component.SCHEMA = {
      type: 'custom',
      obj_type: 'Filepath',
    };

    expect(component.getSchema()).toEqual({
      type: 'custom',
      obj_type: 'Filepath',
    });
  });

  it(
    'should track x and y direction changes towards the bottom of the image' +
      ' while user is moving mouse in the region',
    () => {
      component.userIsCurrentlyDragging = false;
      component.userIsCurrentlyResizing = false;
      component.hoveredRegion = null;
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.mouseX = 500;
      component.mouseY = 500;
      component.resizableBorderWidthPx = 10;
      component.xDirection = 1;
      component.yDirection = 1;

      component.onMouseMoveRegion(0);

      expect(component.xDirection).toBe(-1);
      expect(component.yDirection).toBe(-1);
    }
  );

  it(
    'should track x and y direction changes towards the top of the image' +
      ' while user is moving mouse in the region',
    () => {
      component.userIsCurrentlyDragging = false;
      component.userIsCurrentlyResizing = false;
      component.hoveredRegion = null;
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.mouseX = 100;
      component.mouseY = 100;
      component.resizableBorderWidthPx = 10;
      component.xDirection = -1;
      component.yDirection = -1;

      component.onMouseMoveRegion(0);

      expect(component.xDirection).toBe(1);
      expect(component.yDirection).toBe(1);
    }
  );

  it(
    'should track x and y direction changes towards the top of the image' +
      ' while user is moving mouse in the region',
    () => {
      component.userIsCurrentlyDragging = false;
      component.userIsCurrentlyResizing = false;
      component.hoveredRegion = null;
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and.returnValue([
          {
            getBoundingClientRect: () => {
              return {
                bottom: 1468.6285400390625,
                height: 1297.46533203125,
                left: 477.1180725097656,
                right: 1212.8819885253906,
                top: 171.1632080078125,
                width: 735.763916015625,
                x: 477.1180725097656,
                y: 171.1632080078125,
              };
            },
          },
        ])
      );
      component.originalImageWidth = 968;
      component.originalImageHeight = 1707;
      component.mouseX = 200;
      component.mouseY = 200;
      component.resizableBorderWidthPx = 10;
      component.xDirection = 1;
      component.yDirection = 1;

      component.onMouseMoveRegion(0);

      expect(component.xDirection).toBe(0);
      expect(component.yDirection).toBe(0);
    }
  );

  it(
    'should not track x and y direction changes' +
      ' while user is dragging the region',
    () => {
      component.xDirection = 0;
      component.yDirection = 0;
      component.userIsCurrentlyDragging = true;

      component.onMouseMoveRegion(0);

      // The values tested below must NOT change when the user is
      // not resizing or dragging the region.
      expect(component.xDirection).toBe(0);
      expect(component.yDirection).toBe(0);
    }
  );

  it(
    'should not track x and y direction changes' +
      ' while user is resizing the region',
    () => {
      component.xDirection = 0;
      component.yDirection = 0;
      component.userIsCurrentlyResizing = true;

      component.onMouseMoveRegion(0);

      // The values tested below must NOT change when the user is
      // not resizing or dragging the region.
      expect(component.xDirection).toBe(0);
      expect(component.yDirection).toBe(0);
    }
  );

  it('should delete region when user clicks the trash icon', () => {
    component.selectedRegion = 1;
    component.hoveredRegion = 1;

    expect(component.value.labeledRegions).toEqual([
      {
        label: 'Region1',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.23225103021579202, 0.08157179492961315],
            [0.553006091537647, 0.3235816208679242],
          ],
        },
      },
      {
        label: 'Region2',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.2757432419204503, 0.45691824471291725],
            [0.8751202844752727, 0.69045001942409],
          ],
        },
      },
    ]);

    component.deleteRegion(1);

    expect(component.selectedRegion).toBe(null);
    expect(component.hoveredRegion).toBe(null);
    expect(component.value.labeledRegions).toEqual([
      {
        label: 'Region1',
        region: {
          regionType: 'Rectangle',
          area: [
            [0.23225103021579202, 0.08157179492961315],
            [0.553006091537647, 0.3235816208679242],
          ],
        },
      },
    ]);
  });

  it(
    'should delete region and change hovered and selected region if not null' +
      ' when user deletes a region',
    () => {
      component.selectedRegion = 1;
      component.hoveredRegion = 1;

      expect(component.value.labeledRegions).toEqual([
        {
          label: 'Region1',
          region: {
            regionType: 'Rectangle',
            area: [
              [0.23225103021579202, 0.08157179492961315],
              [0.553006091537647, 0.3235816208679242],
            ],
          },
        },
        {
          label: 'Region2',
          region: {
            regionType: 'Rectangle',
            area: [
              [0.2757432419204503, 0.45691824471291725],
              [0.8751202844752727, 0.69045001942409],
            ],
          },
        },
      ]);

      component.deleteRegion(0);

      expect(component.selectedRegion).toBe(0);
      expect(component.hoveredRegion).toBe(0);
      expect(component.value.labeledRegions).toEqual([
        {
          label: 'Region2',
          region: {
            regionType: 'Rectangle',
            area: [
              [0.2757432419204503, 0.45691824471291725],
              [0.8751202844752727, 0.69045001942409],
            ],
          },
        },
      ]);
    }
  );

  it(
    'should display slanted (225deg) cursor style when user is resizing' +
      'ysing the bottom right corner of the region',
    () => {
      component.xDirection = 1;
      component.yDirection = 1;
      component.xDirectionToggled = true;
      component.yDirectionToggled = true;

      expect(component.getCursorStyle()).toBe('se-resize');
    }
  );

  it(
    'should display slanted (135) cursor style when user is resizing' +
      'the region using the top left corner of the region',
    () => {
      component.xDirection = -1;
      component.yDirection = -1;
      component.xDirectionToggled = true;
      component.yDirectionToggled = true;

      expect(component.getCursorStyle()).toBe('nw-resize');
    }
  );

  it(
    "should display 'pointer' if user is not resizing but cursor" +
      ' is over a region',
    () => {
      component.hoveredRegion = 0;
      component.xDirection = 0;
      component.yDirection = 0;

      expect(component.getCursorStyle()).toBe('pointer');
    }
  );

  it(
    "should display 'crosshair' if user is not resizing and cursor" +
      ' is not over a region',
    () => {
      component.hoveredRegion = null;
      component.xDirection = 0;
      component.yDirection = 0;

      expect(component.getCursorStyle()).toBe('crosshair');
    }
  );

  it(
    "should display 's-resize' cursor style when user is resizing" +
      'the region using the bottom side of the region',
    () => {
      component.xDirection = 0;
      component.yDirection = 1;
      component.xDirectionToggled = false;
      component.yDirectionToggled = true;

      expect(component.getCursorStyle()).toBe('s-resize');
    }
  );

  it(
    "should display 'e-resize' cursor style when user is resizing" +
      'the region using the right side of the region',
    () => {
      component.xDirection = 1;
      component.yDirection = 0;
      component.xDirectionToggled = true;
      component.yDirectionToggled = false;

      expect(component.getCursorStyle()).toBe('e-resize');
    }
  );

  it(
    'should get the preview URL when the image save destination is ' + 'server',
    () => {
      spyOn(contextService, 'getEntityId').and.returnValue('exp_id');
      spyOn(contextService, 'getEntityType').and.returnValue(
        AppConstants.ENTITY_TYPE.EXPLORATION
      );
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
      spyOn(assetsBackendApiService, 'getImageUrlForPreview');

      component.getPreviewUrl('/path/to/image.png');

      expect(assetsBackendApiService.getImageUrlForPreview).toHaveBeenCalled();
    }
  );

  it(
    'should get the preview URL when the image save destination is ' +
      'local storage and image is non SVG',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue(
        AppConstants.ENTITY_TYPE.QUESTION
      );
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
      spyOn(imageLocalStorageService, 'getRawImageData').and.returnValue(
        'data:image/png;dummy%20image'
      );
      spyOn(svgSanitizerService, 'removeAllInvalidTagsAndAttributes');

      component.getPreviewUrl('/path/to/image.png');

      expect(
        svgSanitizerService.removeAllInvalidTagsAndAttributes
      ).not.toHaveBeenCalled();
    }
  );

  it(
    'should get the preview URL when the image save destination is ' +
      'local storage and image is an SVG',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue(
        AppConstants.ENTITY_TYPE.QUESTION
      );
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
      spyOn(imageLocalStorageService, 'getRawImageData').and.returnValue(
        'data:image/svg+xml;dummy%20image'
      );
      spyOn(svgSanitizerService, 'removeAllInvalidTagsAndAttributes');

      component.getPreviewUrl('/path/to/image.svg');

      expect(
        svgSanitizerService.removeAllInvalidTagsAndAttributes
      ).toHaveBeenCalled();
    }
  );
});
