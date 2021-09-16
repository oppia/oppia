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
 * @fileoverview Unit tests for Score Ring Component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ScoreRingComponent } from './score-ring.component';

describe('ConceptCardComponent', () => {
  let fixture: ComponentFixture<ScoreRingComponent>;
  let component: ScoreRingComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ScoreRingComponent,
        MockTranslatePipe
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreRingComponent);
    component = fixture.componentInstance;
    component.score = 1;
  });

  it('should set component properties on initialization', () => {
    spyOn(document, 'querySelector').and.returnValue({
      // This throws "Argument of type '{ r: { baseVal: { value: number; };
      // }; style: { strokeDasharray: string; strokeDashoffset: string; }; }'
      // is not assignable to parameter of type 'Element'.". We need to
      // suppress this error because we need these values for testing the file.
      // @ts-expect-error
      r: {
        baseVal: {
          value: 125
        }
      },
      style: {
        strokeDasharray: '',
        strokeDashoffset: ''
      }
    });

    component.ngOnInit();

    expect(document.querySelector).toHaveBeenCalledWith('.score-ring-circle');
  });

  it('should get score ring color', () => {
    component.isTestPassed = true;

    expect(component.getScoreRingColor())
      .toEqual(component.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR);

    component.isTestPassed = false;

    expect(component.getScoreRingColor())
      .toEqual(component.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR);
  });

  it('should get score outer ring color', () => {
    component.isTestPassed = true;

    expect(component.getScoreOuterRingColor())
      .toEqual(component.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_OUTER);

    component.isTestPassed = false;

    expect(component.getScoreOuterRingColor())
      .toEqual(component.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR_OUTER);
  });

  it('should set the new score if it changes', () => {
    let changes: SimpleChanges = {
      score: {
        currentValue: 35,
        previousValue: 75,
        firstChange: true,
        isFirstChange: () => true
      }
    };
    expect(component.score).toEqual(35);

    component.ngOnChanges(changes);

    expect(component.score).toEqual(75);
    expect(component.circle.style.strokeDashoffset).toEqual('abc');
  });
});
