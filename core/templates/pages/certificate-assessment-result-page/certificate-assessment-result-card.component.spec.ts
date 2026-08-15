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
 * @fileoverview Unit tests for CertificateAssessmentResultCardComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AssessmentResultTopicWiseBreakdownComponent} from './assessment-result-topic-wise-breakdown.component';
import {CertificateAssessmentResultCardComponent} from './certificate-assessment-result-card.component';

describe('CertificateAssessmentResultCardComponent', () => {
  let component: CertificateAssessmentResultCardComponent;
  let fixture: ComponentFixture<CertificateAssessmentResultCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CertificateAssessmentResultCardComponent,
        AssessmentResultTopicWiseBreakdownComponent,
        MockTranslatePipe,
      ],
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
    expect(component.passed).toBeFalse();
  });

  it('should return false when the score is below the passing threshold', () => {
    component.result = {
      certificateName: 'Test Certificate',
      scorePercentage: 69,
      topicBreakdown: [],
      timeTakenMinutes: 10,
    };

    expect(component.passed).toBeFalse();
  });

  it('should return true when the score meets the passing threshold', () => {
    component.result = {
      certificateName: 'Test Certificate',
      scorePercentage: 70,
      topicBreakdown: [],
      timeTakenMinutes: 10,
    };

    expect(component.passed).toBeTrue();
  });

  it('should render the failed certificate image from the mock result', () => {
    fixture.detectChanges();

    const mascotImage = fixture.nativeElement.querySelector(
      '.result-card-mascot-icon'
    ) as HTMLImageElement;
    expect(mascotImage.getAttribute('src')).toBe(
      '/assets/images/certificate-assessment/certificate-assessment-failed.webp'
    );
  });

  it('should allow retry handling without throwing', () => {
    expect(() => component.onRetryAssessment()).not.toThrowError();
  });
});
