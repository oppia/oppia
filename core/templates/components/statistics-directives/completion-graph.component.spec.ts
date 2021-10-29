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
 * @fileoverview Unit tests for the controller of the 'Completion Graph' used by
 * the improvements tab.
 */

import { ImprovementsConstants } from 'domain/improvements/improvements.constants';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompletionGraphComponent } from './completion-graph.component';

describe('Completion Graph Component', () => {
  let fixture: ComponentFixture<CompletionGraphComponent>;
  let component: CompletionGraphComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CompletionGraphComponent,
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletionGraphComponent);
    component = fixture.componentInstance;
  });

  it('should derive style values from the completion rate', () => {
    component.completionRate = 0.65;
    component.ngOnInit();

    expect(component.completionBarStyle['stroke-dasharray']).toBeCloseTo(
      ImprovementsConstants.COMPLETION_BAR_ARC_LENGTH);
    expect(component.completionBarStyle['stroke-dashoffset']).toBeCloseTo(
      ImprovementsConstants.COMPLETION_BAR_ARC_LENGTH *
       (1 - component.completionRate));
  });
});
