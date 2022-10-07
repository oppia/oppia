// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component unit tests for the "enumerated sorted tiles"
 * visualization.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { OppiaVisualizationFrequencyTableComponent } from './oppia-visualization-frequency-table.directive';

describe('Oppia visualization frequency table', () => {
  let component: OppiaVisualizationFrequencyTableComponent;
  let fixture: ComponentFixture<OppiaVisualizationFrequencyTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        OppiaVisualizationFrequencyTableComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      OppiaVisualizationFrequencyTableComponent);
    component = fixture.componentInstance;

    component.options = {
      title: 'options',
      column_headers: ['column_headers0', 'column_headers1']
    };

    fixture.detectChanges();
  });

  it('should intialize component', () => {
    expect(component).toBeDefined();
    expect(component.data).toEqual([]);
    expect(component.addressedInfoIsSupported).toEqual(false);
  });
});
