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
 * @fileoverview Component for the InteractiveMap short response.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ShortResponseInteractiveMapComponent} from './oppia-short-response-interactive-map.component';

describe('ShortResponseInteractiveMapComponent', () => {
  let component: ShortResponseInteractiveMapComponent;
  let fixture: ComponentFixture<ShortResponseInteractiveMapComponent>;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return JSON.parse(answer);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShortResponseInteractiveMapComponent],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortResponseInteractiveMapComponent);
    component = fixture.componentInstance;

    component.answer = '[45.07546020688359,44.75540399551392]';
  });

  it('should initialise component when user submits answer', () => {
    component.ngOnInit();

    expect(component.formattedCoords).toBe('45.075° N, 44.755° E');
  });
});
