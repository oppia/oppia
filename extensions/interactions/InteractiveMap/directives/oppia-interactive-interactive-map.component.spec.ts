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
 * @fileoverview Component for the InteractiveMap interaction.
 */

import {EventEmitter} from '@angular/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {InteractiveMapAnswer} from 'interactions/answer-defs';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {icon, LatLng, LeafletMouseEvent, tileLayer} from 'leaflet';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {InteractiveInteractiveMapComponent} from './oppia-interactive-interactive-map.component';

describe('InteractiveInteractiveMapComponent', () => {
  let component: InteractiveInteractiveMapComponent;
  let fixture: ComponentFixture<InteractiveInteractiveMapComponent>;
  let playerPositionService: PlayerPositionService;
  let currentInteractionService: CurrentInteractionService;
  let interactionAttributesExtractorService: InteractionAttributesExtractorService;
  let mockNewCardAvailableEmitter = new EventEmitter();

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
      interactionId: InteractionSpecsKey,
      attributes: Record<string, string>
    ) {
      return {
        latitude: {
          value: JSON.parse(attributes.latitudeWithValue),
        },
        longitude: {
          value: JSON.parse(attributes.longitudeWithValue),
        },
        zoom: {
          value: JSON.parse(attributes.zoomWithValue),
        },
      };
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (
      answer: InteractiveMapAnswer,
      rulesService: CurrentInteractionService
    ) => {},
    registerCurrentInteraction: (
      submitAnswer: Function,
      validateExpressionFn: Function
    ) => {},
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveInteractiveMapComponent],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: mockInteractionAttributesExtractorService,
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    interactionAttributesExtractorService = TestBed.inject(
      InteractionAttributesExtractorService
    );
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    fixture = TestBed.createComponent(InteractiveInteractiveMapComponent);
    component = fixture.componentInstance;

    component.latitudeWithValue = '45';
    component.longitudeWithValue = '50';
    component.zoomWithValue = '10';
    component.lastAnswer = [50, 55];
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialise component when user adds interaction', () => {
    component.ngOnInit();

    expect(component.coords).toEqual([45, 50]);
    expect(component.zoomLevel).toBe(10);
    expect(component.mapOptions).toEqual(
      jasmine.objectContaining({
        layers: [
          tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }),
        ],
        zoom: 10,
        center: {
          lat: 45,
          lng: 50,
        },
      })
    );
    expect(component.mapMarkers.getLatLng()).toEqual(new LatLng(50, 55));
    expect(component.mapMarkers.options).toEqual({
      icon: icon({
        iconUrl:
          '/extensions/interactions/InteractiveMap/static' + '/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowUrl:
          '/extensions/interactions/InteractiveMap/static' +
          '/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [13, 41],
        iconRetinaUrl:
          '/extensions/interactions/InteractiveMap/' +
          'static/marker-icon-2x.png',
        shadowRetinaUrl:
          '/extensions/interactions/InteractiveMap/' +
          'static/marker-shadow.png',
      }),
    });
  });

  it(
    'should initialise coordinates as 0 when latitude and ' +
      'longitude are undefined',
    () => {
      spyOn(
        interactionAttributesExtractorService,
        'getValuesFromAttributes'
      ).and.returnValue({
        latitude: {
          value: undefined,
        },
        longitude: {
          value: undefined,
        },
        zoom: {
          value: 10,
        },
      });
      component.lastAnswer = null;

      component.ngOnInit();

      expect(component.coords).toEqual([0, 0]);
    }
  );

  it('should set interaction as inactive when a new card is displayed', () => {
    spyOnProperty(playerPositionService, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter
    );
    component.lastAnswer = null;
    component.ngOnInit();

    expect(component.interactionIsActive).toBeTrue();
    expect(component.overlayStyle).toBeUndefined();

    mockNewCardAvailableEmitter.emit();

    expect(component.interactionIsActive).toBeFalse();
    expect(component.overlayStyle).toEqual({
      'background-color': '#fff',
      opacity: 0.5,
      'z-index': 1001,
    });
  });

  it('should add location when user clicks the map', () => {
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();
    let e = {
      latlng: {
        lat: 60,
        lng: 65,
      },
    } as LeafletMouseEvent;
    component.ngOnInit();
    component.interactionIsActive = true;

    expect(component.mapMarkers.getLatLng()).toEqual(new LatLng(50, 55));

    component.leafletClick(e);

    expect(component.mapMarkers.getLatLng()).toEqual(new LatLng(60, 65));
    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
  });

  it('should not add location when user clicks the map', () => {
    spyOn(currentInteractionService, 'onSubmit').and.callThrough();
    let e = {
      latlng: {
        lat: 60,
        lng: 65,
      },
    } as LeafletMouseEvent;
    component.ngOnInit();
    component.interactionIsActive = false;

    expect(component.mapMarkers.getLatLng()).toEqual(new LatLng(50, 55));

    component.leafletClick(e);

    expect(component.mapMarkers.getLatLng()).toEqual(new LatLng(50, 55));
    expect(currentInteractionService.onSubmit).not.toHaveBeenCalled();
  });

  it('should set overlay when mouse enters map', () => {
    expect(component.overlayStyle).toBeUndefined();

    component.leafletMouseOver();

    expect(component.overlayStyle).toEqual({
      'background-color': '#fff',
      opacity: 0.5,
      'z-index': 1001,
    });
  });

  it('should not set overlay when interaction is active', () => {
    component.interactionIsActive = true;

    expect(component.overlayStyle).toBeUndefined();

    component.leafletMouseOver();

    expect(component.overlayStyle).toBeUndefined();
  });

  it('should hide overlay when mouse leaves map', () => {
    expect(component.overlayStyle).toBeUndefined();

    component.leafletMouseOut();

    expect(component.overlayStyle).toEqual({
      'background-color': '#fff',
      opacity: 0,
      'z-index': 0,
    });
  });

  it('should hide overlay when interaction is active', () => {
    component.interactionIsActive = true;

    expect(component.overlayStyle).toBeUndefined();

    component.leafletMouseOut();

    expect(component.overlayStyle).toBeUndefined();
  });
});
