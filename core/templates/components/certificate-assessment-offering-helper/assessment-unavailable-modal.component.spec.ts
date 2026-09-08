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
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {AssessmentUnavailableModalComponent} from './assessment-unavailable-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('AssessmentUnavailableModalComponent', () => {
  let component: AssessmentUnavailableModalComponent;
  let fixture: ComponentFixture<AssessmentUnavailableModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [AssessmentUnavailableModalComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentUnavailableModalComponent);
    component = fixture.componentInstance;
  });

  it('should default to visible', () => {
    expect(component.isVisible).toBe(true);
  });

  it('should render the overlay when visible', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.assessment-unavailable-overlay')
    ).not.toBeNull();
  });

  it('should remove the overlay when isVisible is false', () => {
    component.isVisible = false;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.assessment-unavailable-overlay')
    ).toBeNull();
  });

  it('should move initial focus to the modal action button', () => {
    fixture.detectChanges();

    const actionButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.assessment-unavailable-action-button'
    );
    expect(document.activeElement).toBe(actionButton);
  });

  it('should not render a focusable action button when the modal is hidden', () => {
    component.isVisible = false;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '.assessment-unavailable-action-button'
      )
    ).toBeNull();
  });

  it('should keep Tab focus within the modal', () => {
    fixture.detectChanges();
    const tabEvent = new KeyboardEvent('keydown', {key: 'Tab'});
    spyOn(tabEvent, 'preventDefault');
    spyOn(component.goToCertificatesButton.nativeElement, 'focus');

    component.containFocusWithinModal(tabEvent);

    expect(tabEvent.preventDefault).toHaveBeenCalled();
    expect(
      component.goToCertificatesButton.nativeElement.focus
    ).toHaveBeenCalled();
  });

  it('should ignore non-Tab keys in the focus containment handler', () => {
    fixture.detectChanges();
    const enterEvent = new KeyboardEvent('keydown', {key: 'Enter'});
    spyOn(enterEvent, 'preventDefault');
    spyOn(component.goToCertificatesButton.nativeElement, 'focus');

    component.containFocusWithinModal(enterEvent);

    expect(enterEvent.preventDefault).not.toHaveBeenCalled();
    expect(
      component.goToCertificatesButton.nativeElement.focus
    ).not.toHaveBeenCalled();
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
