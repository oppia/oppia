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
 * @fileoverview Component for the InteractiveMap response.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { icon, LatLng, tileLayer } from 'leaflet';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ResponseInteractiveMapComponent } from './oppia-response-interactive-map.component';

describe('ResponseInteractiveMapComponent', () => {
  let component: ResponseInteractiveMapComponent;
  let fixture: ComponentFixture<ResponseInteractiveMapComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseInteractiveMapComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseInteractiveMapComponent);
    component = fixture.componentInstance;

    component.answer = '[50, 55]';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.mapOptions).toEqual(jasmine.objectContaining({
      layers: [tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
      )
      ],
      zoom: 8,
      center: {
        lat: 50,
        lng: 55
      }
    }));
    expect(component.mapMarkers.getLatLng())
      .toEqual(new LatLng(50, 55));
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
      })
    });
  });
});
