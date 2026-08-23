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
 * @fileoverview Unit tests for CertificateAssessmentResultCardComponent.
 */

import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {CertificateAssessmentTitledBackgroundBannerComponent} from 'components/certificate-assessment-offering-helper/certificate-assessment-titled-shared-background-banner.component';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AssessmentResultTopicWiseBreakdownComponent} from './assessment-result-topic-wise-breakdown.component';
import {CertificateAssessmentResultCardComponent} from './certificate-assessment-result-card.component';

describe('CertificateAssessmentResultCardComponent', () => {
  let component: CertificateAssessmentResultCardComponent;
  let fixture: ComponentFixture<CertificateAssessmentResultCardComponent>;
  let backendApiServiceSpy: jasmine.SpyObj<CertificateAssessmentOfferingBackendApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    backendApiServiceSpy = jasmine.createSpyObj(
      'CertificateAssessmentOfferingBackendApiService',
      ['getCertificateAssessmentResultAsync']
    );
    backendApiServiceSpy.getCertificateAssessmentResultAsync.and.returnValue(
      Promise.resolve({
        certificate_id: 'cert-1',
        title: 'Everyday Arithmetic & Number Confidence',
        total_score: 80,
        time_taken_in_minutes: 35,
        attempt_data: {
          topic_1: {
            topic_name: 'Place Values',
            total_related_questions: 5,
            total_correct_questions: 4,
          },
          topic_2: {
            topic_name: 'Multiplication',
            total_related_questions: 4,
            total_correct_questions: 2,
          },
        },
        is_submitted: true,
      })
    );
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        CertificateAssessmentResultCardComponent,
        AssessmentResultTopicWiseBreakdownComponent,
        CertificateAssessmentTitledBackgroundBannerComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: backendApiServiceSpy,
        },
        {provide: Router, useValue: routerSpy},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentResultCardComponent);
    component = fixture.componentInstance;
  });

  it('should render the provided attempt id', () => {
    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    expect(component.attemptId).toBe('attempt-1');
  });

  it('should return false when no result is available', () => {
    expect(component.passed).toBe(false);
  });

  it('should return false when the score is below the passing threshold', () => {
    component.result = {
      certificateName: 'Test Certificate',
      scorePercentage: 69,
      topicBreakdown: [],
      timeTakenMinutes: null,
    };

    expect(component.passed).toBe(false);
  });

  it('should return true when the score meets the passing threshold', () => {
    component.result = {
      certificateName: 'Test Certificate',
      scorePercentage: 80,
      topicBreakdown: [],
      timeTakenMinutes: null,
    };

    expect(component.passed).toBe(true);
  });

  it('should fetch the real result and map it for display', async () => {
    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();

    expect(
      backendApiServiceSpy.getCertificateAssessmentResultAsync
    ).toHaveBeenCalledWith('attempt-1');
    expect(component.certificateId).toBe('cert-1');
    expect(component.result).toEqual({
      certificateName: 'Everyday Arithmetic & Number Confidence',
      scorePercentage: 80,
      topicBreakdown: [
        {
          topicName: 'Place Values',
          scorePercentage: 80,
          totalCorrectQuestions: 4,
          totalRelatedQuestions: 5,
        },
        {
          topicName: 'Multiplication',
          scorePercentage: 50,
          totalCorrectQuestions: 2,
          totalRelatedQuestions: 4,
        },
      ],
      timeTakenMinutes: 35,
    });
    expect(component.isLoading).toBe(false);
  });

  it('should map a topic with no related questions to a zero score', async () => {
    backendApiServiceSpy.getCertificateAssessmentResultAsync.and.returnValue(
      Promise.resolve({
        certificate_id: 'cert-1',
        title: 'Test Certificate',
        total_score: 99,
        attempt_data: {
          topic_1: {
            topic_name: 'Place Values',
            total_related_questions: 0,
            total_correct_questions: 0,
          },
        },
        is_submitted: true,
      })
    );

    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();

    expect(component.result?.topicBreakdown).toEqual([
      {
        topicName: 'Place Values',
        scorePercentage: 0,
        totalCorrectQuestions: 0,
        totalRelatedQuestions: 0,
      },
    ]);
  });

  it('should render the time taken from the real response', async () => {
    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const timeTakenElement = fixture.nativeElement.querySelector(
      '.result-card-time-taken'
    ) as HTMLElement;
    expect(timeTakenElement.textContent).toContain('35');
  });

  it('should hide the time taken when the attempt is unfinished', async () => {
    backendApiServiceSpy.getCertificateAssessmentResultAsync.and.returnValue(
      Promise.resolve({
        certificate_id: 'cert-1',
        title: 'Test Certificate',
        total_score: 10,
        time_taken_in_minutes: null,
        attempt_data: {
          topic_1: {
            topic_name: 'Place Values',
            total_related_questions: 5,
            total_correct_questions: 2,
          },
        },
        is_submitted: false,
      })
    );

    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.result-card-time-taken')
    ).toBeNull();
  });

  it('should render the failed image when the score is below the threshold', async () => {
    backendApiServiceSpy.getCertificateAssessmentResultAsync.and.returnValue(
      Promise.resolve({
        certificate_id: 'cert-1',
        title: 'Test Certificate',
        total_score: 50,
        attempt_data: {
          topic_1: {
            topic_name: 'Place Values',
            total_related_questions: 5,
            total_correct_questions: 2,
          },
        },
        is_submitted: true,
      })
    );

    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const mascotImage = fixture.nativeElement.querySelector(
      '.result-card-mascot-icon'
    ) as HTMLImageElement;
    expect(mascotImage.getAttribute('src')).toBe(
      '/assets/images/certificate-assessment/certificate-assessment-failed.webp'
    );
  });

  it('should render the passed image when the score meets the threshold', async () => {
    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const mascotImage = fixture.nativeElement.querySelector(
      '.result-card-mascot-icon'
    ) as HTMLImageElement;
    expect(mascotImage.getAttribute('src')).toBe(
      '/assets/images/certificate-assessment/certificate-assessment-passed.webp'
    );
  });

  it('should keep the result empty when the request fails', async () => {
    backendApiServiceSpy.getCertificateAssessmentResultAsync.and.returnValue(
      Promise.reject('Error')
    );

    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();

    expect(component.result).toBeNull();
    expect(component.hasError).toBe(true);
    expect(component.isLoading).toBe(false);
  });

  it('should navigate to the assessment introduction when retrying', () => {
    component.certificateId = 'cert-1';

    component.onRetryAssessment();

    expect(routerSpy.navigate).toHaveBeenCalledWith([
      '/certificate-assessment',
      'cert-1',
    ]);
  });

  it('should pass the assessment title, exit button text and route to the shared banner', async () => {
    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const banner = fixture.debugElement.query(
      By.directive(CertificateAssessmentTitledBackgroundBannerComponent)
    ).componentInstance as CertificateAssessmentTitledBackgroundBannerComponent;

    expect(banner.title).toBe('I18N_CERTIFICATE_ASSESSMENT');
    expect(banner.buttonText).toBe('I18N_CERTIFICATE_ASSESSMENT_EXIT_BUTTON');
    expect(banner.buttonRoute).toEqual(['/learner-dashboard']);
  });
});
