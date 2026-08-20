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
 * @fileoverview Unit tests for AssessmentUnavailableModalComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {AssessmentUnavailableModalComponent} from './assessment-unavailable-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('AssessmentUnavailableModalComponent', () => {
  let component: AssessmentUnavailableModalComponent;
  let fixture: ComponentFixture<AssessmentUnavailableModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssessmentUnavailableModalComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentUnavailableModalComponent);
    component = fixture.componentInstance;
  });

  it('should default to visible', () => {
    expect(component.isVisible).toBeTrue();
  });

  it('should hide when isVisible is false', () => {
    component.isVisible = false;
    expect(component.isVisible).toBeFalse();
  });

  it('should emit goToAvailableCertificates when the button is clicked', () => {
    spyOn(component.goToAvailableCertificates, 'emit');
    fixture.detectChanges();

    const goToCertificatesButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    goToCertificatesButton.click();

    expect(component.goToAvailableCertificates.emit).toHaveBeenCalled();
  });
});
