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
 * @fileoverview Unit tests for the ImageClickInput interaction.
 */

import { async, ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { InteractiveImageClickInput } from './oppia-interactive-image-click-input.component';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { ImageClickAnswer } from 'interactions/answer-defs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContextService } from 'services/context.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { EventEmitter } from '@angular/core';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';

describe('InteractiveImageClickInput', () => {
  let fixture: ComponentFixture<InteractiveImageClickInput>;
  let contextService: ContextService;
  let component: InteractiveImageClickInput;
  let imagePreloaderService: ImagePreloaderService;
  let currentInteractionService: CurrentInteractionService;
  let mockNewCardAvailableEmitter = new EventEmitter();
  let playerPositionService: PlayerPositionService;
  let imageUrl = '/assetsdevhandler/exploration/expId/assets/image/' +
  'img_20210616_110856_oxqveyuhr3_height_778_width_441.svg';

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(interactionId, attributes) {
      return {
        imageAndRegions: {
          value: JSON.parse(attributes.imageAndRegionsWithValue)
        },
        highlightRegionsOnHover: {
          value: JSON.parse(attributes.highlightRegionsOnHoverWithValue)
        }
      };
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (answer, rulesService) => {
      expect(answer).toEqual({ clickPosition: [1, 2], clickedRegions: [] });
    },
    registerCurrentInteraction: (submitAnswer, validateExpressionFn) => {}
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [InteractiveImageClickInput],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: mockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    imagePreloaderService = TestBed.get(ImagePreloaderService);
    contextService = TestBed.inject(ContextService);
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    playerPositionService = TestBed.get(PlayerPositionService);
    fixture = TestBed.createComponent(InteractiveImageClickInput);
    component = fixture.componentInstance;

    component.imageAndRegionsWithValue = '{' +
    '  "imagePath": "img_20210616_110856_oxqveyuhr3_height_778_width_' +
    '441.svg",' +
    '  "labeledRegions": [' +
    '    {' +
    '      "label": "Region1",' +
    '      "region": {' +
    '        "regionType": "Rectangle",' +
    '        "area": [' +
    '          [' +
    '            0.3557347670250896,' +
    '            0.25571807421685533' +
    '          ],' +
    '          [' +
    '            0.6693548387096774,' +
    '            0.4274671235666757' +
    '          ]' +
    '        ]' +
    '      }' +
    '    },' +
    '    {' +
    '      "label": "Region2",' +
    '      "region": {' +
    '        "regionType": "Rectangle",' +
    '        "area": [' +
    '          [' +
    '            0.39695340501792115,' +
    '            0.5301100465508879' +
    '          ],' +
    '          [' +
    '            0.8431899641577061,' +
    '            0.7181193609279102' +
    '          ]' +
    '        ]' +
    '      }' +
    '    }' +
    '  ]' +
    '}';
    component.highlightRegionsOnHoverWithValue = 'true';
    component.lastAnswer = {
      clickPosition: [1, 2],
      clickedRegions: ['region1']
    } as ImageClickAnswer;
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize when interaction is added in the exploration' +
  ' editor', () => {
    spyOn(component, 'loadImage');
    spyOn(component, 'updateCurrentlyHoveredRegions');
    spyOn(currentInteractionService, 'registerCurrentInteraction');

    component.ngOnInit();

    expect(component.imageAndRegions).toEqual({
      imagePath: 'img_20210616_110856_oxqveyuhr3_height_778_width_441.svg',
      labeledRegions: [
        {
          label: 'Region1',
          region: {
            regionType: 'Rectangle',
            area: [
              [
                0.3557347670250896,
                0.25571807421685533
              ],
              [
                0.6693548387096774,
                0.4274671235666757
              ]
            ]
          }
        },
        {
          label: 'Region2',
          region: {
            regionType: 'Rectangle',
            area: [
              [
                0.39695340501792115,
                0.5301100465508879
              ],
              [
                0.8431899641577061,
                0.7181193609279102
              ]
            ]
          }
        }
      ]
    });
    expect(component.highlightRegionsOnHover).toBe(true);
    expect(component.filepath)
      .toBe('img_20210616_110856_oxqveyuhr3_height_778_width_441.svg');
    expect(component.loadingIndicatorUrl)
      .toBe('/assets/images/activity/loadingIndicator.gif');
    expect(component.isLoadingIndicatorShown).toBe(false);
    expect(component.isTryAgainShown).toBe(false);
    expect(component.dimensions).toEqual({height: 778, width: 441});
    expect(component.imageContainerStyle)
      .toEqual({height: '778px', width: '441px'});
    expect(component.interactionIsActive).toBe(false);
    expect(component.currentlyHoveredRegions).toEqual([]);
    expect(component.imageUrl).toBe(imageUrl);
    expect(component.mouseX).toBe(1);
    expect(component.mouseY).toBe(2);
    expect(component.loadImage).not.toHaveBeenCalled();
    expect(component.updateCurrentlyHoveredRegions).toHaveBeenCalled();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalledWith(null, null);
  });

  it('should initialize when interaction is played in the exploration' +
  ' player', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(true);
    spyOn(component, 'loadImage');
    spyOn(component, 'updateCurrentlyHoveredRegions');
    spyOn(currentInteractionService, 'registerCurrentInteraction');

    component.ngOnInit();

    expect(component.imageAndRegions).toEqual({
      imagePath: 'img_20210616_110856_oxqveyuhr3_height_778_width_441.svg',
      labeledRegions: [
        {
          label: 'Region1',
          region: {
            regionType: 'Rectangle',
            area: [
              [
                0.3557347670250896,
                0.25571807421685533
              ],
              [
                0.6693548387096774,
                0.4274671235666757
              ]
            ]
          }
        },
        {
          label: 'Region2',
          region: {
            regionType: 'Rectangle',
            area: [
              [
                0.39695340501792115,
                0.5301100465508879
              ],
              [
                0.8431899641577061,
                0.7181193609279102
              ]
            ]
          }
        }
      ]
    });
    expect(component.highlightRegionsOnHover).toBe(true);
    expect(component.filepath)
      .toBe('img_20210616_110856_oxqveyuhr3_height_778_width_441.svg');
    expect(component.loadingIndicatorUrl)
      .toBe('/assets/images/activity/loadingIndicator.gif');
    expect(component.isLoadingIndicatorShown).toBe(true);
    expect(component.isTryAgainShown).toBe(false);
    expect(component.dimensions).toEqual({height: 778, width: 441});
    expect(component.imageContainerStyle).toEqual({height: '778px'});
    expect(component.loadingIndicatorStyle)
      .toEqual({height: '120px', width: '120px'});
    expect(component.interactionIsActive).toBe(false);
    expect(component.currentlyHoveredRegions).toEqual([]);
    expect(component.imageUrl).toBe('');
    expect(component.mouseX).toBe(1);
    expect(component.mouseY).toBe(2);
    expect(component.loadImage).toHaveBeenCalled();
    expect(component.updateCurrentlyHoveredRegions).toHaveBeenCalled();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalledWith(null, null);
  });

  it('should initialize when interaction is played in the exploration' +
  ' player', () => {
    spyOnProperty(playerPositionService, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    component.ngOnInit();
    component.lastAnswer = null;

    mockNewCardAvailableEmitter.emit();

    expect(component.interactionIsActive).toBe(false);
    expect(component.lastAnswer).toEqual({
      clickPosition: [1, 2],
      clickedRegions: []
    });
  });

  it('should load image when component is initialised', fakeAsync(() => {
    spyOn(imagePreloaderService, 'getImageUrlAsync').and
      .returnValue(Promise.resolve(imageUrl));
    component.filepath =
      'img_20210616_110856_oxqveyuhr3_height_778_width_441.svg';
    component.isTryAgainShown = true;
    component.isLoadingIndicatorShown = true;

    component.loadImage();
    flushMicrotasks();

    expect(component.isTryAgainShown).toBe(false);
    expect(component.isLoadingIndicatorShown).toBe(false);
    expect(component.imageUrl).toBe(imageUrl);
  }));

  it('should not load image when image url is not returned', fakeAsync(() => {
    spyOn(imagePreloaderService, 'getImageUrlAsync').and
      .returnValue(Promise.reject('failure'));
    component.filepath =
      'img_20210616_110856_oxqveyuhr3_height_778_width_441.svg';
    component.isTryAgainShown = false;
    component.isLoadingIndicatorShown = true;

    component.loadImage();
    flushMicrotasks();

    expect(component.isTryAgainShown).toBe(true);
    expect(component.isLoadingIndicatorShown).toBe(false);
  }));

  it('should not highlight last answer if interaction is active' +
  ' in exploration player', () => {
    spyOn(component, 'updateCurrentlyHoveredRegions');
    component.lastAnswer = null;

    component.ngOnInit();

    expect(component.interactionIsActive).toBe(true);
    expect(component.mouseX).toBe(0);
    expect(component.mouseY).toBe(0);
    expect(component.updateCurrentlyHoveredRegions).not.toHaveBeenCalled();
  });

  it('should highlight last answer if interaction is not active' +
  ' in exploration player', () => {
    spyOn(component, 'updateCurrentlyHoveredRegions').and.callThrough();
    component.lastAnswer.clickPosition = [0.4, 0.4];

    component.ngOnInit();

    expect(component.interactionIsActive).toBe(false);
    expect(component.mouseX).toBe(0.4);
    expect(component.mouseY).toBe(0.4);
    expect(component.updateCurrentlyHoveredRegions).toHaveBeenCalled();
    expect(component.currentlyHoveredRegions).toEqual(['Region1']);
  });

  it('should return \'inline\' if mouse is over the region', () => {
    component.currentlyHoveredRegions = ['Region1'];

    expect(component.getRegionDisplay('Region1')).toBe('inline');
  });

  it('should return \'none\' if mouse is not over the region', () => {
    component.currentlyHoveredRegions = ['Region1'];

    expect(component.getRegionDisplay('No_Region')).toBe('none');
  });

  it('should return dot location when called', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and
        .returnValue([{
          parentElement: {
            getBoundingClientRect: () => {
              return new DOMRect(300, 300, 300, 300);
            }
          },
          getBoundingClientRect: () => {
            return new DOMRect(200, 200, 200, 200);
          },
          width: 200,
          height: 200
        }]));

    component.ngOnInit();

    expect(component.getDotLocation()).toEqual({left: 95, top: 295});
  });

  it('should check if mouse is over region when mouse moves', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and
        .returnValue([{
          parentElement: {
            getBoundingClientRect: () => {
              return new DOMRect(300, 300, 300, 300);
            }
          },
          getBoundingClientRect: () => {
            return new DOMRect(200, 200, 200, 200);
          },
          width: 200,
          height: 200
        }]));
    spyOn(component, 'updateCurrentlyHoveredRegions').and.callThrough();
    spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(290);
    spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(260);
    let evt = new MouseEvent('Mousemove');
    component.lastAnswer = null;
    component.ngOnInit();

    expect(component.interactionIsActive).toBe(true);
    expect(component.mouseX).toBe(0);
    expect(component.mouseY).toBe(0);
    expect(component.currentlyHoveredRegions).toEqual([]);

    component.onMousemoveImage(evt);

    // The mouseX and mouseY variables must be updated only
    // when the interaction is active.
    expect(component.interactionIsActive).toBe(true);
    expect(component.mouseX).toBe(0.45);
    expect(component.mouseY).toBe(0.3);
    expect(component.currentlyHoveredRegions).toEqual(['Region1']);
  });

  it('should not check if mouse is over region when interaction is not' +
  ' active', () => {
    spyOn(component, 'updateCurrentlyHoveredRegions').and.callThrough();
    spyOnProperty(MouseEvent.prototype, 'pageX', 'get').and.returnValue(290);
    spyOnProperty(MouseEvent.prototype, 'pageY', 'get').and.returnValue(260);
    let evt = new MouseEvent('Mousemove');
    component.lastAnswer.clickPosition = [0.4, 0.4];
    component.ngOnInit();

    expect(component.interactionIsActive).toBe(false);
    expect(component.mouseX).toBe(0.4);
    expect(component.mouseY).toBe(0.4);
    expect(component.currentlyHoveredRegions).toEqual(['Region1']);

    component.onMousemoveImage(evt);

    // The mouseX and mouseY variables must be updated only
    // when the interaction is active.
    expect(component.interactionIsActive).toBe(false);
    expect(component.mouseX).toBe(0.4);
    expect(component.mouseY).toBe(0.4);
    expect(component.currentlyHoveredRegions).toEqual(['Region1']);
  });

  it('should not check if mouse is over region when interaction is not' +
  ' active', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and
        .returnValue([{
          parentElement: {
            getBoundingClientRect: () => {
              return new DOMRect(300, 300, 300, 300);
            }
          },
          getBoundingClientRect: () => {
            return new DOMRect(200, 200, 200, 200);
          },
          width: 200,
          height: 200
        }]));
    spyOn(component, 'updateCurrentlyHoveredRegions').and.callThrough();
    var evt = document.createEvent('MouseEvent');
    evt.initMouseEvent(
      'click', true, true, window, 1,
      800, 600, 290, 260, false, false, false, false, 0, null
    );
    component.ngOnInit();

    expect(component.getRegionDimensions(1)).toEqual(
      {
        left: -20.609318996415766,
        top: 6.02200931017758,
        width: 89.24731182795699,
        height: 37.60186287540446
      });
  });

  it('should submit when image is clicked', () => {
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();
    component.ngOnInit();

    component.onClickImage();

    expect(currentInteractionService.onSubmit)
      .toHaveBeenCalledWith(
        { clickPosition: [1, 2], clickedRegions: [] }, jasmine.any(Object)
      );
  });

  it('should show region if in exploration editor', () => {
    spyOn(contextService, 'getEditorTabContext').and.returnValue('editor');

    expect(component.getDotDisplay()).toBe('none');
  });

  it('should not show region if not in exploration editor', () => {
    spyOn(contextService, 'getEditorTabContext').and.returnValue('preview');

    expect(component.getDotDisplay()).toBe('inline');
  });
});
