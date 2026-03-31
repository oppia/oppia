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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, SimpleChanges} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ScoreRingComponent} from './score-ring.component';

describe('Score Ring Component', () => {
  let fixture: ComponentFixture<ScoreRingComponent>;
  let component: ScoreRingComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ScoreRingComponent, MockTranslatePipe],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreRingComponent);
    component = fixture.componentInstance;
    component.score = 35;
  });

  it('should set component properties on initialization', () => {
    component.score = 35;
    component.scoreRingElement = {
      nativeElement: {
        r: {
          // This throws "Type '{ value: number; }' is missing the following
          // properties from type 'SVGLength': unitType, valueAsString,
          // valueInSpecifiedUnits, convertToSpecifiedUnits, and 12 more.".
          // We need to suppress this error because only this value is
          // needed for testing and providing a value for every single property
          // is unnecessary.
          // @ts-expect-error
          baseVal: {
            value: 125,
          },
        },
        // This throws "Type
        // '{ strokeDasharray: string; strokeDashoffset: string; }' is missing
        // the following properties from type 'CSSStyleDeclaration':
        // accentColor, alignContent, alignItems, alignSelf, and 447 more.".
        // We need to suppress this error because only these values are
        // needed for testing and providing a value for every single property is
        // unnecessary.
        // @ts-expect-error
        style: {
          strokeDasharray: '',
          strokeDashoffset: '',
        },
      },
    };

    component.ngAfterViewInit();

    expect(component.circle.r.baseVal.value).toBe(125);
  });

  it('should get score ring color', () => {
    component.score = 35;
    component.testIsPassed = true;

    expect(component.getScoreRingColor()).toEqual(
      component.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR
    );

    component.testIsPassed = false;

    expect(component.getScoreRingColor()).toEqual(
      component.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR
    );
  });

  it('should get score outer ring color', () => {
    component.score = 35;
    component.testIsPassed = true;

    expect(component.getScoreOuterRingColor()).toEqual(
      component.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_OUTER
    );

    component.testIsPassed = false;

    expect(component.getScoreOuterRingColor()).toEqual(
      component.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR_OUTER
    );
  });

  it('should set the new score if it changes', fakeAsync(() => {
    let changes: SimpleChanges = {
      score: {
        currentValue: 75,
        previousValue: 35,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.scoreRingElement = {
      nativeElement: {
        r: {
          // This throws "Type '{ value: number; }' is missing the following
          // properties from type 'SVGLength': unitType, valueAsString,
          // valueInSpecifiedUnits, convertToSpecifiedUnits, and 12 more.".
          // We need to suppress this error because only this value is
          // needed for testing and providing a value for every single property
          // is unnecessary.
          // @ts-expect-error
          baseVal: {
            value: 125,
          },
        },
        // This throws "Type
        // '{ strokeDasharray: string; strokeDashoffset: string; }' is missing
        // the following properties from type 'CSSStyleDeclaration':
        // accentColor, alignContent, alignItems, alignSelf, and 447 more.".
        // We need to suppress this error because only these values are
        // needed for testing and providing a value for every single property is
        // unnecessary.
        // @ts-expect-error
        style: {
          strokeDasharray: '',
          strokeDashoffset: '',
        },
      },
    };

    expect(component.score).toEqual(35);

    component.ngAfterViewInit();
    component.ngOnChanges(changes);
    tick(2000);

    expect(
      Math.round(parseFloat(component.circle.style.strokeDashoffset))
    ).toEqual(196);
  }));
});
