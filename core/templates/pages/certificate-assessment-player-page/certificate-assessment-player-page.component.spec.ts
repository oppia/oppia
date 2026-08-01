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
 * @fileoverview Unit tests for CertificateAssessmentPlayerPageComponent.
 */

import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';

describe('CertificateAssessmentPlayerPageComponent', () => {
  let component: CertificateAssessmentPlayerPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentPlayerPageComponent>;
  let router: Router;

  const activatedRouteStub = (routePath: string | null) => ({
    snapshot: {
      paramMap: {
        get: (name: string) => {
          if (name === 'certificate_id') {
            return 'cert-123';
          }
          return null;
        },
      },
      url: routePath ? [{path: routePath}] : [],
    },
  });

  const configureComponent = async (
    routePath: string | null
  ): Promise<void> => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentPlayerPageComponent],
      imports: [CommonModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRouteStub(routePath),
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentPlayerPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  };

  beforeEach(async () => {
    await configureComponent(null);
  });

  it('should initialize intro stage for the base route', () => {
    fixture.detectChanges();

    expect(component.certificateId).toBe('cert-123');
    expect(component.currentStage).toBe('intro');
  });

  it('should set current stage to questions when route is session', async () => {
    await configureComponent('session');
    fixture.detectChanges();
    expect(component.currentStage).toBe('questions');
  });

  it('should set current stage to result when route is result', async () => {
    await configureComponent('result');
    fixture.detectChanges();
    expect(component.currentStage).toBe('result');
  });

  it('should navigate to the session route on startAssessment', () => {
    fixture.detectChanges();

    component.startAssessment();

    expect(router.navigate).toHaveBeenCalledWith(['session'], {
      relativeTo: TestBed.inject(ActivatedRoute),
    });
  });

  it('should navigate to the result route on submitAssessment', () => {
    spyOn(Date, 'now').and.returnValue(1234);
    fixture.detectChanges();

    component.submitAssessment();

    expect(router.navigate).toHaveBeenCalledWith([
      '/certificate-assessment/cert-123/result',
      'attempt-1234',
    ]);
  });

  it('should switch to the instructions stage on showInstructions', () => {
    fixture.detectChanges();
    expect(component.currentStage).toBe('intro');

    component.showInstructions();

    expect(component.currentStage).toBe('instructions');
  });

  it('should advance to the next question on nextQuestion when not at the last question', () => {
    fixture.detectChanges();
    expect(component.currentQuestionIndex).toBe(0);

    component.nextQuestion();

    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not advance past the last question on nextQuestion', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = component.mockQuestions.length - 1;

    component.nextQuestion();

    expect(component.currentQuestionIndex).toBe(
      component.mockQuestions.length - 1
    );
  });

  it('should compute the progress percentage based on the current question index', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 0;
    expect(component.getProgressPercentage()).toBe(
      Math.round((1 / component.mockQuestions.length) * 100)
    );

    component.currentQuestionIndex = component.mockQuestions.length - 1;
    expect(component.getProgressPercentage()).toBe(100);
  });

  it('should return the question at the current question index', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 1;

    expect(component.getCurrentQuestion()).toEqual(component.mockQuestions[1]);
  });

  it('should hide the modals by default', () => {
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('oppia-time-expired-modal'))
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css('oppia-unanswered-question-modal'))
    ).toBeNull();
  });

  it('should show the time-expired modal when showTimeExpiredModal is true', () => {
    fixture.detectChanges();
    component.showTimeExpiredModal = true;
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('oppia-time-expired-modal'))
    ).toBeTruthy();
  });

  it('should show the unanswered-question modal when showUnansweredQuestionModal is true', () => {
    fixture.detectChanges();
    component.showUnansweredQuestionModal = true;
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('oppia-unanswered-question-modal'))
    ).toBeTruthy();
  });
});
