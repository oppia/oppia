// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AssessmentInterruptComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {AssessmentInterruptComponent} from './assessment-interrupt.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('AssessmentInterruptComponent', () => {
  let component: AssessmentInterruptComponent;
  let fixture: ComponentFixture<AssessmentInterruptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssessmentInterruptComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentInterruptComponent);
    component = fixture.componentInstance;
  });

  it('should default to visible', () => {
    expect(component.isVisible).toBeTrue();
  });

  it('should hide when isVisible is false', () => {
    component.isVisible = false;
    expect(component.isVisible).toBeFalse();
  });

  it('should emit retryAssessment when the retry button is clicked', () => {
    spyOn(component.retryAssessment, 'emit');
    fixture.detectChanges();

    const retryButton: HTMLButtonElement =
      fixture.nativeElement.querySelectorAll('button')[0];
    retryButton.click();

    expect(component.retryAssessment.emit).toHaveBeenCalled();
  });

  it('should emit resumeAssessment when the resume button is clicked', () => {
    spyOn(component.resumeAssessment, 'emit');
    fixture.detectChanges();

    const resumeButton: HTMLButtonElement =
      fixture.nativeElement.querySelectorAll('button')[1];
    resumeButton.click();

    expect(component.resumeAssessment.emit).toHaveBeenCalled();
  });
});
