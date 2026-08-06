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

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';

describe('CertificateAssessmentPlayerPageComponent', () => {
  let component: CertificateAssessmentPlayerPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentPlayerPageComponent>;
  let router: Router;
  let activatedRouteStubValue: {
    snapshot: {
      paramMap: {get: (name: string) => string | null};
      url: {path: string}[];
    };
  };

  const configureComponent = async (
    routePath: string | null
  ): Promise<void> => {
    activatedRouteStubValue = {
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
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentPlayerPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRouteStubValue,
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

  it('should initialize intro stage for the base route and expose the certificate id', () => {
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

  it('should keep intro stage when the route path is unrecognized', async () => {
    await configureComponent('unknown');
    fixture.detectChanges();
    expect(component.currentStage).toBe('intro');
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
      '/certificate-assessment',
      'cert-123',
      'result',
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

  it('should go back one question when previousQuestion is called away from the start', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 2;

    component.previousQuestion();

    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not go back past the first question', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 0;

    component.previousQuestion();

    expect(component.currentQuestionIndex).toBe(0);
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

  it('should report whether the current question is the last one', () => {
    fixture.detectChanges();
    component.currentQuestionIndex = 0;
    expect(component.isCurrentQuestionLast()).toBeFalse();

    component.currentQuestionIndex = component.mockQuestions.length - 1;
    expect(component.isCurrentQuestionLast()).toBeTrue();
  });

  it('should read and store submitted responses by question index', () => {
    fixture.detectChanges();

    expect(component.getSavedResponse()).toBe('');

    component.updateResponse('b');
    expect(component.getSavedResponse()).toBe('b');

    component.currentQuestionIndex = 1;
    expect(component.getSavedResponse()).toBe('');
  });
});
