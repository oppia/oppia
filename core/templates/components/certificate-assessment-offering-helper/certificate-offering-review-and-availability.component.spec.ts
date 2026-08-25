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
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';

import {CertificateOfferingReviewAndAvailabilityComponent} from './certificate-offering-review-and-availability.component';
import {ValidationResponse} from './certificate-offering-review-and-availability.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';

describe('Certificate Offering Review And Availability Component', () => {
  let component: CertificateOfferingReviewAndAvailabilityComponent;
  let fixture: ComponentFixture<CertificateOfferingReviewAndAvailabilityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CertificateOfferingReviewAndAvailabilityComponent],
      providers: [
        {
          provide: ClassroomBackendApiService,
          useValue: {
            getAllClassroomsSummaryAsync: async () => Promise.resolve([]),
            fetchClassroomDataAsync: async () => Promise.resolve(null),
          },
        },
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: {
            validateCertificateAssessmentOfferingAsync: async () =>
              Promise.resolve({
                is_valid: true,
                validation_errors: {},
                validation_message: '',
              }),
          },
        },
      ],
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

  it('should load validation state on init and emit validity', fakeAsync(() => {
    const validitySpy = spyOn(component.isCertificateValidChange, 'emit');
    const classroomBackendApiSpy = spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(
      Promise.resolve([
        {
          classroom_id: 'math_classroom_id',
          name: 'Math',
          url_fragment: 'math',
          teaser_text: '',
          is_published: true,
          thumbnail_filename: '',
          thumbnail_bg_color: '',
        },
      ])
    );
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'fetchClassroomDataAsync'
    ).and.returnValue(
      Promise.resolve({
        getName: () => 'Math',
        getTopicSummaries: () => [
          {
            getId: () => 'topic_1',
            getName: () => 'Place Values',
          },
        ],
      } as never)
    );
    spyOn(
      TestBed.inject(CertificateAssessmentOfferingBackendApiService),
      'validateCertificateAssessmentOfferingAsync'
    ).and.returnValue(
      Promise.resolve({
        is_valid: true,
        validation_errors: {},
        validation_message: 'Looks good.',
      })
    );
    component.certificateAssessmentOffering.classroomId = 'math_classroom_id';
    component.certificateAssessmentOffering.topicData = {topic_1: 1};
    component.certificateAssessmentOffering.totalQuestions = 10;

    fixture.detectChanges();
    flushMicrotasks();

    expect(classroomBackendApiSpy).toHaveBeenCalled();
    expect(component.topicNameMap).toEqual({topic_1: 'Place Values'});
    expect(component.validationMessage).toEqual('Looks good.');
    expect(component.isValid).toBeTrue();
    expect(validitySpy).toHaveBeenCalledWith(true);
  }));

  it('should fall back to an error state when validation loading fails', fakeAsync(() => {
    spyOn(component.isCertificateValidChange, 'emit');
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(Promise.reject(new Error('boom')));

    component.certificateAssessmentOffering.classroomId = 'math_classroom_id';
    fixture.detectChanges();
    flushMicrotasks();

    expect(component.isValid).toBeFalse();
    expect(component.validationErrors).toEqual({});
    expect(component.validationMessage).toEqual('boom');
  }));

  it('should show an error when the selected classroom is missing', fakeAsync(() => {
    const validitySpy = spyOn(component.isCertificateValidChange, 'emit');
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(
      Promise.resolve([
        {
          classroom_id: 'science_classroom_id',
          name: 'Science',
          url_fragment: 'science',
          teaser_text: '',
          is_published: true,
          thumbnail_filename: '',
          thumbnail_bg_color: '',
        },
      ])
    );

    component.certificateAssessmentOffering.classroomId = 'math_classroom_id';
    fixture.detectChanges();
    flushMicrotasks();

    expect(component.isValid).toBeFalse();
    expect(component.validationErrors).toEqual({});
    expect(component.validationMessage).toEqual(
      'Selected classroom could not be found.'
    );
    expect(validitySpy).toHaveBeenCalledWith(false);
  }));

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
        easyAvailable: 5,
        mediumAvailable: 3,
        hardAvailable: 0,
        easyRequired: 5,
        mediumRequired: 10,
        hardRequired: 3,
        totalQuestions: 8,
        totalRequiredQuestions: 18,
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

  it('should set loading state while refreshing validation', fakeAsync(() => {
    let resolveValidation: (value: ValidationResponse) => void = () => {};
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(
      Promise.resolve([
        {
          classroom_id: 'math_classroom_id',
          name: 'Math',
          url_fragment: 'math',
          teaser_text: '',
          is_published: true,
          thumbnail_filename: '',
          thumbnail_bg_color: '',
        },
      ])
    );
    spyOn(
      TestBed.inject(ClassroomBackendApiService),
      'fetchClassroomDataAsync'
    ).and.returnValue(
      Promise.resolve({
        getName: () => 'Math',
        getTopicSummaries: () => [],
      } as never)
    );
    spyOn(
      TestBed.inject(CertificateAssessmentOfferingBackendApiService),
      'validateCertificateAssessmentOfferingAsync'
    ).and.returnValue(
      new Promise(resolve => {
        resolveValidation = resolve;
      })
    );

    component.certificateAssessmentOffering.classroomId = 'math_classroom_id';
    component.certificateAssessmentOffering.topicData = {topic_1: 1};
    component.certificateAssessmentOffering.totalQuestions = 3;
    void component.refreshValidationState();

    expect(component.isLoadingValidation).toBeTrue();
    resolveValidation({
      is_valid: true,
      validation_errors: {},
      validation_message: '',
    });
    flushMicrotasks();
    expect(component.isLoadingValidation).toBeFalse();
  }));
});
