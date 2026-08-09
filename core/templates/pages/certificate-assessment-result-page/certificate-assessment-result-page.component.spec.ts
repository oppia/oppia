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
 * @fileoverview Unit tests for CertificateAssessmentResultPageComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AssessmentResultTopicWiseBreakdownComponent} from './assessment-result-topic-wise-breakdown.component';
import {CertificateAssessmentResultCardComponent} from './certificate-assessment-result-card.component';
import {CertificateAssessmentResultPageComponent} from './certificate-assessment-result-page.component';

describe('CertificateAssessmentResultPageComponent', () => {
  let component: CertificateAssessmentResultPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentResultPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CertificateAssessmentResultPageComponent,
        CertificateAssessmentResultCardComponent,
        AssessmentResultTopicWiseBreakdownComponent,
        MockTranslatePipe,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentResultPageComponent);
    component = fixture.componentInstance;
  });

  it('should pass the attempt id to the result card', () => {
    component.attemptId = 'attempt-1';
    fixture.detectChanges();

    const resultCard = fixture.debugElement.query(
      By.directive(CertificateAssessmentResultCardComponent)
    );
    expect(resultCard.componentInstance.attemptId).toBe('attempt-1');
  });
});
