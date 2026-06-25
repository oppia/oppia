// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CertificateOfferingReviewAndAvailabilityComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {CertificateOfferingReviewAndAvailabilityComponent} from './certificate-offering-review-and-availability.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';

describe('Certificate Offering Review And Availability Component', () => {
  let component: CertificateOfferingReviewAndAvailabilityComponent;
  let fixture: ComponentFixture<CertificateOfferingReviewAndAvailabilityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateOfferingReviewAndAvailabilityComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CertificateOfferingReviewAndAvailabilityComponent
    );
    component = fixture.componentInstance;
    component.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createEmpty();
  });

  it('should populate stub data on init when stub mode is enabled', () => {
    component.useStubData = true;
    fixture.detectChanges();

    expect(component.validationErrors).toEqual({
      topic_adding_numbers: {
        easy: {required: 5, available: 5},
        medium: {required: 5, available: 8},
        hard: {required: 3, available: 4},
      },
      topic_fractions: {
        easy: {required: 5, available: 6},
        medium: {required: 10, available: 3},
        hard: {required: 3, available: 0},
      },
      topic_percentages: {
        easy: {required: 5, available: 4},
        medium: {required: 5, available: 5},
        hard: {required: 3, available: 2},
      },
    });
    expect(component.isValid).toBeFalse();
    expect(component.topicNameMap).toEqual({
      topic_adding_numbers: 'Adding Numbers',
      topic_fractions: 'Fractions',
      topic_percentages: 'Percentages',
    });
    expect(component.topicReadinessRows).toEqual([
      {
        topicId: 'topic_adding_numbers',
        topicName: 'Adding Numbers',
        easy: 5,
        medium: 8,
        hard: 4,
        totalQuestions: 17,
        isReady: true,
        easySufficient: true,
        mediumSufficient: true,
        hardSufficient: true,
      },
      {
        topicId: 'topic_fractions',
        topicName: 'Fractions',
        easy: 6,
        medium: 3,
        hard: 0,
        totalQuestions: 9,
        isReady: false,
        easySufficient: true,
        mediumSufficient: false,
        hardSufficient: false,
      },
      {
        topicId: 'topic_percentages',
        topicName: 'Percentages',
        easy: 4,
        medium: 5,
        hard: 2,
        totalQuestions: 11,
        isReady: false,
        easySufficient: false,
        mediumSufficient: true,
        hardSufficient: false,
      },
    ]);
    expect(component.errorMessages).toEqual([
      {
        topicName: 'Fractions',
        difficulty: 'Medium',
        available: 3,
        required: 10,
        isZero: false,
      },
      {
        topicName: 'Fractions',
        difficulty: 'Hard',
        available: 0,
        required: 3,
        isZero: true,
      },
      {
        topicName: 'Percentages',
        difficulty: 'Easy',
        available: 4,
        required: 5,
        isZero: false,
      },
      {
        topicName: 'Percentages',
        difficulty: 'Hard',
        available: 2,
        required: 3,
        isZero: false,
      },
    ]);
  });

  it('should preserve real inputs when stub mode is disabled', () => {
    component.validationErrors = {
      topic_fractions: {
        easy: {required: 5, available: 5},
        medium: {required: 10, available: 3},
        hard: {required: 3, available: 0},
      },
    };
    component.topicNameMap = {
      topic_fractions: 'Fractions',
    };

    fixture.detectChanges();

    expect(component.validationErrors).toEqual({
      topic_fractions: {
        easy: {required: 5, available: 5},
        medium: {required: 10, available: 3},
        hard: {required: 3, available: 0},
      },
    });
    expect(component.topicNameMap).toEqual({
      topic_fractions: 'Fractions',
    });
    expect(component.topicReadinessRows).toEqual([
      {
        topicId: 'topic_fractions',
        topicName: 'Fractions',
        easy: 5,
        medium: 3,
        hard: 0,
        totalQuestions: 8,
        isReady: false,
        easySufficient: true,
        mediumSufficient: false,
        hardSufficient: false,
      },
    ]);
  });

  it('should format error text for zero and non-zero availability', () => {
    expect(
      component.getErrorText({
        topicName: 'Fractions',
        difficulty: 'Hard',
        available: 0,
        required: 3,
        isZero: true,
      })
    ).toBe('Fractions: No hard difficulty questions available');

    expect(
      component.getErrorText({
        topicName: 'Percentages',
        difficulty: 'Easy',
        available: 4,
        required: 5,
        isZero: false,
      })
    ).toBe('Percentages: Only 4 easy questions (minimum 5 required)');
  });

  it('should collect error messages for insufficient difficulty counts', () => {
    fixture = TestBed.createComponent(
      CertificateOfferingReviewAndAvailabilityComponent
    );
    component = fixture.componentInstance;
    component.validationErrors = {
      topic_fractions: {
        easy: {required: 5, available: 5},
        medium: {required: 10, available: 3},
        hard: {required: 3, available: 0},
      },
    };
    component.topicNameMap = {
      topic_fractions: 'Fractions',
    };

    fixture.detectChanges();

    expect(component.isValid).toBeTrue();
    expect(component.topicReadinessRows).toEqual([
      {
        topicId: 'topic_fractions',
        topicName: 'Fractions',
        easy: 5,
        medium: 3,
        hard: 0,
        totalQuestions: 8,
        isReady: false,
        easySufficient: true,
        mediumSufficient: false,
        hardSufficient: false,
      },
    ]);
    expect(component.errorMessages).toEqual([
      {
        topicName: 'Fractions',
        difficulty: 'Medium',
        available: 3,
        required: 10,
        isZero: false,
      },
      {
        topicName: 'Fractions',
        difficulty: 'Hard',
        available: 0,
        required: 3,
        isZero: true,
      },
    ]);
  });

  it('should rebuild derived data when validation inputs change', () => {
    component.validationErrors = {
      topic_fractions: {
        easy: {required: 5, available: 5},
        medium: {required: 10, available: 3},
        hard: {required: 3, available: 0},
      },
    };
    component.topicNameMap = {
      topic_fractions: 'Fractions',
    };

    fixture.detectChanges();

    component.validationErrors = {
      topic_percentages: {
        easy: {required: 5, available: 4},
        medium: {required: 5, available: 5},
        hard: {required: 3, available: 2},
      },
    };
    component.topicNameMap = {
      topic_percentages: 'Percentages',
    };

    component.ngOnChanges({
      validationErrors: {
        currentValue: component.validationErrors,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
      topicNameMap: {
        currentValue: component.topicNameMap,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.topicReadinessRows).toEqual([
      {
        topicId: 'topic_percentages',
        topicName: 'Percentages',
        easy: 4,
        medium: 5,
        hard: 2,
        totalQuestions: 11,
        isReady: false,
        easySufficient: false,
        mediumSufficient: true,
        hardSufficient: false,
      },
    ]);
    expect(component.errorMessages).toEqual([
      {
        topicName: 'Percentages',
        difficulty: 'Easy',
        available: 4,
        required: 5,
        isZero: false,
      },
      {
        topicName: 'Percentages',
        difficulty: 'Hard',
        available: 2,
        required: 3,
        isZero: false,
      },
    ]);
  });

  it('should get correct save button text depending on mode', () => {
    component.isEditMode = false;
    expect(component.getSaveButtonText()).toEqual('Save Certificate');

    component.isEditMode = true;
    expect(component.getSaveButtonText()).toEqual('Update Certificate');
  });

  it('should emit save event when clicking save button', () => {
    const saveSpy = spyOn(component.saveCertificateOffering, 'emit');

    component.onSaveClicked();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should emit back navigation event when clicking back button', () => {
    const navigateSpy = spyOn(component.navigateToAddTopicsSection, 'emit');

    component.onBackClicked();

    expect(navigateSpy).toHaveBeenCalled();
  });
});
