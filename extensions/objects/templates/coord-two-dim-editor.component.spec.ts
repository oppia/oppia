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
 * @fileoverview Unit tests for coord two dim editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { icon, LatLng, LeafletEvent, LeafletMouseEvent, tileLayer} from 'leaflet';
import { CoordTwoDimEditorComponent } from './coord-two-dim-editor.component';

describe('CoordTwoDimEditorComponent', () => {
  let component: CoordTwoDimEditorComponent;
  let fixture: ComponentFixture<CoordTwoDimEditorComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CoordTwoDimEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoordTwoDimEditorComponent);
    component = fixture.componentInstance;

    component.value = [0, 0];
  });

  it('should create', () => {
    expect(component).toBeDefined();
    component.ngOnInit();
  });

  it('should initialise component when world map interaction is edited', () => {
    component.ngOnInit();

    expect(component.options).toEqual(
      jasmine.objectContaining({
        layers: [tileLayer(
          'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
        )
        ],
        zoom: 0,
        center: {
          lat: 0,
          lng: 0
        }
      }));
    expect(component.mapMarkers.getLatLng())
      .toEqual(new LatLng(0, 0));
    expect(component.mapMarkers.options).toEqual({
      icon: icon({
        iconUrl: '/extensions/interactions/InteractiveMap/static' +
        '/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowUrl: '/extensions/interactions/InteractiveMap/static' +
         '/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [13, 41],
        iconRetinaUrl: '/extensions/interactions/InteractiveMap/' +
          'static/marker-icon-2x.png',
        shadowRetinaUrl: '/extensions/interactions/InteractiveMap/' +
          'static/marker-shadow.png'
      }),
      draggable: true
    });
  });

  it('should update marked location when user stops dragging', () => {
    let e = {
      target: {
        _latlng: {
          lat: 45,
          lng: 50
        }
      }
    } as unknown as LeafletEvent;

    component.leafletMove(e);

    expect(component.value).toEqual([45, 50]);
  });

  it('should add location when user clicks', () => {
    spyOn(component.valueChanged, 'emit');
    let e = {
      latlng: {
        lat: 45,
        lng: 50
      }
    } as unknown as LeafletMouseEvent;

    component.leafletClick(e);

    expect(component.value).toEqual([45, 50]);
    expect(component.mapMarkers.getLatLng())
      .toEqual(new LatLng(45, 50));
    expect(component.valueChanged.emit).toHaveBeenCalledWith([45, 50]);
  });
});
