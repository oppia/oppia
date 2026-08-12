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
 * @fileoverview Unit tests for CertificateAssessmentPlayerPageRootComponent.
 */

import {fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {AppConstants} from 'app.constants';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentAttemptData,
  CertificateAssessmentOfferingData,
} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {PageHeadService} from 'services/page-head.service';
import {AlertsService} from 'services/alerts.service';
import {CertificateAssessmentPlayerPageRootComponent} from './certificate-assessment-player-page-root.component';

describe('CertificateAssessmentPlayerPageRootComponent', () => {
  let component: CertificateAssessmentPlayerPageRootComponent;
  let alertsService: AlertsService;
  let certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService;
  let router: Router;

  const mockOffering = new CertificateAssessmentOfferingData(
    'cert-123',
    'Everyday Arithmetic & Number Confidence',
    'Certificate description.',
    'math_classroom_01',
    {topic_place_values: 1},
    12,
    60,
    ['Understanding of numbers'],
    'Available',
    1
  );

  const mockAttempt = CertificateAssessmentAttemptData.createFromBackendDict({
    attempt_id: 'attempt-1234',
    questions: [
      {question_id: 'question_1', question_version: 1},
      {question_id: 'question_2', question_version: 2},
    ],
  });

  const configureComponent = async (
    routePath: string | null
  ): Promise<void> => {
    const activatedRouteStubValue = {
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
    const certificateAssessmentOfferingBackendApiServiceSpy =
      jasmine.createSpyObj('CertificateAssessmentOfferingBackendApiService', [
        'getCertificateAssessmentOfferingAsync',
        'startCertificateAssessmentAttemptAsync',
        'submitCertificateAssessmentAttemptAsync',
      ]);
    certificateAssessmentOfferingBackendApiServiceSpy.getCertificateAssessmentOfferingAsync.and.returnValue(
      Promise.resolve(mockOffering)
    );
    certificateAssessmentOfferingBackendApiServiceSpy.startCertificateAssessmentAttemptAsync.and.returnValue(
      Promise.resolve(mockAttempt)
    );
    certificateAssessmentOfferingBackendApiServiceSpy.submitCertificateAssessmentAttemptAsync.and.returnValue(
      Promise.resolve({attempt_id: 'attempt-1234', is_submitted: true})
    );

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', [
      'addWarning',
    ]);

    component = new CertificateAssessmentPlayerPageRootComponent(
      activatedRouteStubValue as unknown as ActivatedRoute,
      alertsServiceSpy,
      certificateAssessmentOfferingBackendApiServiceSpy,
      {} as ClassroomBackendApiService,
      {} as PageHeadService,
      routerSpy,
      {} as TranslateService
    );
    alertsService = alertsServiceSpy;
    certificateAssessmentOfferingBackendApiService =
      certificateAssessmentOfferingBackendApiServiceSpy;
    router = routerSpy;
  };

  beforeEach(async () => {
    await configureComponent(null);
  });

  it('should set the title from AppConstants', () => {
    expect(component.title).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_PLAYER
        .TITLE
    );
  });

  it('should set the meta tags from AppConstants', () => {
    expect(component.meta).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_PLAYER
        .META as unknown as typeof component.meta
    );
  });

  it('should initialize the intro stage for the base route and load the offering', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();

    expect(component.certificateId).toBe('cert-123');
    expect(component.currentStage).toBe('intro');
    expect(
      certificateAssessmentOfferingBackendApiService.getCertificateAssessmentOfferingAsync
    ).toHaveBeenCalledWith('cert-123');
    expect(component.certificateOffering).toEqual(mockOffering);
    expect(component.isLoading).toBe(false);
  }));

  it('should set current stage to questions when the route is session', fakeAsync(async () => {
    await configureComponent('session');
    component.ngOnInit();
    flushMicrotasks();

    expect(component.currentStage).toBe('questions');
  }));

  it('should keep the intro stage when the route path is unrecognized', fakeAsync(async () => {
    await configureComponent('unknown');
    component.ngOnInit();
    flushMicrotasks();

    expect(component.currentStage).toBe('intro');
  }));

  it('should redirect to the 404 page when the offering fails to load', fakeAsync(() => {
    (
      certificateAssessmentOfferingBackendApiService.getCertificateAssessmentOfferingAsync as jasmine.Spy
    ).and.returnValue(Promise.reject('Error'));

    component.ngOnInit();
    flushMicrotasks();

    expect(component.hasError).toBe(true);
    expect(component.isLoading).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
  }));

  it('should keep the in-page error state when the 404 redirect fails', fakeAsync(() => {
    (
      certificateAssessmentOfferingBackendApiService.getCertificateAssessmentOfferingAsync as jasmine.Spy
    ).and.returnValue(Promise.reject('Error'));
    (router.navigate as jasmine.Spy).and.returnValue(
      Promise.reject(new Error('Navigation failed'))
    );

    component.ngOnInit();
    flushMicrotasks();

    expect(component.hasError).toBe(true);
    expect(component.isLoading).toBe(false);
  }));

  it('should switch to the instructions stage on showInstructions', () => {
    component.showInstructions();

    expect(component.currentStage).toBe('instructions');
  });

  it('should start a real attempt and switch to questions on startAssessment', fakeAsync(() => {
    component.startAssessment();
    flushMicrotasks();

    expect(
      certificateAssessmentOfferingBackendApiService.startCertificateAssessmentAttemptAsync
    ).toHaveBeenCalledWith('cert-123');
    expect(component.attempt).toEqual(mockAttempt);
    expect(component.currentStage).toBe('questions');
  }));

  it('should show a warning when starting the attempt fails', fakeAsync(() => {
    (
      certificateAssessmentOfferingBackendApiService.startCertificateAssessmentAttemptAsync as jasmine.Spy
    ).and.returnValue(Promise.reject('Error'));

    component.startAssessment();
    flushMicrotasks();

    expect(component.currentStage).toBe('intro');
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to start the certificate assessment.'
    );
  }));

  it('should submit the attempt and navigate to the result page on assessmentSubmitted', fakeAsync(() => {
    component.attempt = mockAttempt;
    const answers = [
      {question_id: 'question_1', is_correct: true, selected_answer: 'b'},
    ];

    component.onAssessmentSubmitted(answers);
    flushMicrotasks();

    expect(
      certificateAssessmentOfferingBackendApiService.submitCertificateAssessmentAttemptAsync
    ).toHaveBeenCalledWith('attempt-1234', answers);
    expect(router.navigate).toHaveBeenCalledWith([
      '/certificate-assessment-result',
      'attempt-1234',
    ]);
  }));

  it('should not submit when there is no attempt', fakeAsync(() => {
    component.onAssessmentSubmitted([]);
    flushMicrotasks();

    expect(
      certificateAssessmentOfferingBackendApiService.submitCertificateAssessmentAttemptAsync
    ).not.toHaveBeenCalled();
  }));

  it('should show a warning when submitting the attempt fails', fakeAsync(() => {
    component.attempt = mockAttempt;
    (
      certificateAssessmentOfferingBackendApiService.submitCertificateAssessmentAttemptAsync as jasmine.Spy
    ).and.returnValue(Promise.reject('Error'));

    component.onAssessmentSubmitted([]);
    flushMicrotasks();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to submit the certificate assessment.'
    );
  }));

  it('should reset to the intro stage on retry', () => {
    component.showAssessmentInterruptCard = true;
    component.currentStage = 'questions';

    component.onRetryAssessment();

    expect(component.showAssessmentInterruptCard).toBe(false);
    expect(component.currentStage).toBe('intro');
  });

  it('should resume to the questions stage on resume', () => {
    component.showAssessmentInterruptCard = true;
    component.currentStage = 'intro';

    component.onResumeAssessment();

    expect(component.showAssessmentInterruptCard).toBe(false);
    expect(component.currentStage).toBe('questions');
  });
});
