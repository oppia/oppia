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
 * @fileoverview Unit tests for CertificateAssessmentPlayerPageRootComponent.
 */

import {fakeAsync, flushMicrotasks, TestBed, tick} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {EventEmitter} from '@angular/core';
import {AppConstants} from 'app.constants';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentAttemptData,
  CertificateAssessmentOfferingData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {PageHeadService} from 'services/page-head.service';
import {AlertsService} from 'services/alerts.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';
import {CertificateAssessmentPlayerPageRootComponent} from './certificate-assessment-player-page-root.component';

describe('CertificateAssessmentPlayerPageRootComponent', () => {
  let component: CertificateAssessmentPlayerPageRootComponent;
  let alertsService: AlertsService;
  let certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService;
  let internetConnectivityService: InternetConnectivityService;
  let mockConnectionServiceEmitter: EventEmitter<boolean>;
  let router: Router;
  let translateService: jasmine.SpyObj<TranslateService>;

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
        'attemptCertificateAssessmentAsync',
        'submitCertificateAssessmentAttemptAsync',
      ]);
    certificateAssessmentOfferingBackendApiServiceSpy.getCertificateAssessmentOfferingAsync.and.returnValue(
      Promise.resolve(mockOffering)
    );
    certificateAssessmentOfferingBackendApiServiceSpy.attemptCertificateAssessmentAsync.and.returnValue(
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
    mockConnectionServiceEmitter = new EventEmitter<boolean>();
    const internetConnectivityServiceSpy = jasmine.createSpyObj(
      'InternetConnectivityService',
      ['startCheckingConnection', 'isOnline']
    );
    internetConnectivityServiceSpy.startCheckingConnection.and.returnValue(
      undefined
    );
    internetConnectivityServiceSpy.isOnline.and.returnValue(true);
    internetConnectivityServiceSpy.onInternetStateChange =
      mockConnectionServiceEmitter;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{provide: ActivatedRoute, useValue: activatedRouteStubValue}],
    });

    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
    ]);
    translateServiceSpy.instant.and.callFake((key: string) => key);

    component = new CertificateAssessmentPlayerPageRootComponent(
      TestBed.inject(ActivatedRoute),
      alertsServiceSpy,
      certificateAssessmentOfferingBackendApiServiceSpy,
      {} as ClassroomBackendApiService,
      internetConnectivityServiceSpy,
      {} as PageHeadService,
      routerSpy,
      translateServiceSpy
    );
    alertsService = alertsServiceSpy;
    certificateAssessmentOfferingBackendApiService =
      certificateAssessmentOfferingBackendApiServiceSpy;
    internetConnectivityService = internetConnectivityServiceSpy;
    router = routerSpy;
    translateService = translateServiceSpy;
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

  it('should start an attempt and switch to questions when the route is session', fakeAsync(async () => {
    await configureComponent('session');
    component.ngOnInit();
    flushMicrotasks();

    expect(
      certificateAssessmentOfferingBackendApiService.attemptCertificateAssessmentAsync
    ).toHaveBeenCalledWith('cert-123');
    expect(component.attempt).toEqual(mockAttempt);
    expect(component.currentStage).toBe('questions');
    expect(component.remainingTimeInSeconds).toBe(3600);
    component.ngOnDestroy();
  }));

  it('should keep the intro stage when the route path is unrecognized', fakeAsync(async () => {
    await configureComponent('unknown');
    component.ngOnInit();
    flushMicrotasks();

    expect(component.currentStage).toBe('intro');
  }));

  it('should stay on the intro stage when the session route fails to start an attempt', fakeAsync(async () => {
    await configureComponent('session');
    (
      certificateAssessmentOfferingBackendApiService.attemptCertificateAssessmentAsync as jasmine.Spy
    ).and.returnValue(Promise.reject('Error'));

    component.ngOnInit();
    flushMicrotasks();

    expect(component.attempt).toBeNull();
    expect(component.currentStage).toBe('intro');
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_CERTIFICATE_ASSESSMENT_START_WARNING'
    );
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'I18N_CERTIFICATE_ASSESSMENT_START_WARNING'
    );
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
    component.certificateId = 'cert-123';
    component.startAssessment();
    flushMicrotasks();

    expect(
      certificateAssessmentOfferingBackendApiService.attemptCertificateAssessmentAsync
    ).toHaveBeenCalledWith('cert-123');
    expect(component.attempt).toEqual(mockAttempt);
    expect(component.currentStage).toBe('questions');
  }));

  it('should start the countdown timer when questions are available', fakeAsync(() => {
    spyOn(window, 'setInterval').and.returnValue(123 as never);
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    expect(component.remainingTimeInSeconds).toBe(3600);
    expect(window.setInterval).toHaveBeenCalled();
  }));

  it('should decrement the countdown and mark the assessment expired at zero', fakeAsync(() => {
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();
    expect(component.remainingTimeInSeconds).toBe(3600);

    tick(2000);
    expect(component.remainingTimeInSeconds).toBe(3598);
    expect(component.isTimeExpired).toBeFalse();

    tick(3598000);
    expect(component.remainingTimeInSeconds).toBe(0);
    expect(component.isTimeExpired).toBeTrue();
  }));

  it('should not start the countdown without an attempt', () => {
    spyOn(window, 'setInterval');
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    expect(window.setInterval).not.toHaveBeenCalled();
    expect(component.remainingTimeInSeconds).toBe(0);
  });

  it('should not start the countdown without a positive time limit', () => {
    spyOn(window, 'setInterval');
    component.attempt = mockAttempt;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    expect(window.setInterval).not.toHaveBeenCalled();
    expect(component.remainingTimeInSeconds).toBe(0);
  });

  it('should not start the countdown outside the questions stage', () => {
    spyOn(window, 'setInterval');
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_INTRO;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    expect(window.setInterval).not.toHaveBeenCalled();
    expect(component.remainingTimeInSeconds).toBe(0);
  });

  it('should not restart an already running countdown', () => {
    spyOn(window, 'setInterval').and.returnValue(123 as never);
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();
    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    expect(window.setInterval).toHaveBeenCalledTimes(1);
  });

  it('should clear the countdown timer on destroy', fakeAsync(() => {
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();
    expect(
      (component as unknown as {timerId: number | null}).timerId
    ).not.toBeNull();

    component.ngOnDestroy();

    expect(
      (component as unknown as {timerId: number | null}).timerId
    ).toBeNull();
  }));

  it('should pause the countdown and preserve remaining time when going offline', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();
    tick(5000);
    expect(component.remainingTimeInSeconds).toBe(3595);

    mockConnectionServiceEmitter.emit(false);

    expect(
      (component as unknown as {timerId: number | null}).timerId
    ).toBeNull();
    expect(component.remainingTimeInSeconds).toBe(3595);

    tick(3000);
    expect(component.remainingTimeInSeconds).toBe(3595);
  }));

  it('should not pause the countdown when offline outside the questions stage', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_INTRO;

    mockConnectionServiceEmitter.emit(false);

    expect(
      (component as unknown as {timerId: number | null}).timerId
    ).toBeNull();
  }));

  it('should show the interrupt card when reconnecting after a network loss', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    mockConnectionServiceEmitter.emit(false);
    expect(component.showAssessmentInterruptCard).toBeFalse();

    mockConnectionServiceEmitter.emit(true);
    expect(component.showAssessmentInterruptCard).toBeTrue();
  }));

  it('should not show the interrupt card when reconnecting without a network loss', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();

    mockConnectionServiceEmitter.emit(true);

    expect(component.showAssessmentInterruptCard).toBeFalse();
    component.ngOnDestroy();
  }));

  it('should resume the countdown from the preserved time on resume', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();
    tick(5000);
    mockConnectionServiceEmitter.emit(false);
    expect(component.remainingTimeInSeconds).toBe(3595);

    component.onResumeAssessment();

    expect(component.showAssessmentInterruptCard).toBeFalse();
    expect(component.currentStage).toBe('questions');
    tick(2000);
    expect(component.remainingTimeInSeconds).toBe(3593);
    component.ngOnDestroy();
  }));

  it('should reset timer state and go to the intro stage on retry', fakeAsync(() => {
    component.ngOnInit();
    flushMicrotasks();
    component.attempt = mockAttempt;
    component.certificateOffering = mockOffering;
    component.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;

    (
      component as unknown as {startTimerIfReady: () => void}
    ).startTimerIfReady();
    tick(5000);
    mockConnectionServiceEmitter.emit(false);

    component.onRetryAssessment();

    expect(component.showAssessmentInterruptCard).toBeFalse();
    expect(component.currentStage).toBe('intro');
    expect(component.remainingTimeInSeconds).toBe(0);
    expect(
      (component as unknown as {timerId: number | null}).timerId
    ).toBeNull();
    expect(
      (component as unknown as {hasStartedTimer: boolean}).hasStartedTimer
    ).toBeFalse();
  }));

  it('should not navigate to results when there is no attempt', fakeAsync(() => {
    component.onViewResults();
    flushMicrotasks();

    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should show a warning when starting the attempt fails', fakeAsync(() => {
    (
      certificateAssessmentOfferingBackendApiService.attemptCertificateAssessmentAsync as jasmine.Spy
    ).and.returnValue(Promise.reject('Error'));

    component.startAssessment();
    flushMicrotasks();

    expect(component.currentStage).toBe('intro');
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_CERTIFICATE_ASSESSMENT_START_WARNING'
    );
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'I18N_CERTIFICATE_ASSESSMENT_START_WARNING'
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
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_RESULT.ROUTE.split('/')[0]}`,
      'attempt-1234',
    ]);
  }));

  it('should keep the user on the assessment page after an auto-submit', fakeAsync(() => {
    component.attempt = mockAttempt;
    component.isTimeExpired = true;
    const answers = [{question_id: 'question_1', is_correct: true}];

    component.onAssessmentSubmitted(answers);
    flushMicrotasks();

    expect(router.navigate).not.toHaveBeenCalled();
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
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_CERTIFICATE_ASSESSMENT_SUBMIT_WARNING'
    );
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'I18N_CERTIFICATE_ASSESSMENT_SUBMIT_WARNING'
    );
  }));

  it('should navigate to the result page when view results is requested', fakeAsync(() => {
    component.attempt = mockAttempt;

    component.onViewResults();
    flushMicrotasks();

    expect(router.navigate).toHaveBeenCalledWith([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_RESULT.ROUTE.split('/')[0]}`,
      'attempt-1234',
    ]);
  }));

  it('should navigate to the learner dashboard when the assessment is ended', fakeAsync(() => {
    component.onAssessmentEnded();
    flushMicrotasks();

    expect(router.navigate).toHaveBeenCalledWith([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_DASHBOARD.ROUTE}`,
    ]);
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

  it('should switch to the intro stage on showIntro', () => {
    component.currentStage = 'questions';

    component.showIntro();

    expect(component.currentStage).toBe('intro');
  });

  it('should load the classroom url fragment from the offering classroom', fakeAsync(() => {
    const classroomBackendApiServiceSpy = jasmine.createSpyObj(
      'ClassroomBackendApiService',
      ['getClassroomDataAsync']
    );
    classroomBackendApiServiceSpy.getClassroomDataAsync.and.returnValue(
      Promise.resolve({classroomDict: {urlFragment: 'math'}})
    );

    component = new CertificateAssessmentPlayerPageRootComponent(
      TestBed.inject(ActivatedRoute),
      alertsService,
      certificateAssessmentOfferingBackendApiService,
      classroomBackendApiServiceSpy,
      internetConnectivityService,
      {} as PageHeadService,
      router,
      translateService
    );

    component.ngOnInit();
    flushMicrotasks();

    expect(
      classroomBackendApiServiceSpy.getClassroomDataAsync
    ).toHaveBeenCalledWith('math_classroom_01');
    expect(component.classroomUrlFragment).toBe('math');
  }));

  it('should keep classroom url fragment empty when classroom API fails', fakeAsync(() => {
    const classroomBackendApiServiceSpy = jasmine.createSpyObj(
      'ClassroomBackendApiService',
      ['getClassroomDataAsync']
    );
    classroomBackendApiServiceSpy.getClassroomDataAsync.and.returnValue(
      Promise.reject(new Error('Classroom not found'))
    );

    component = new CertificateAssessmentPlayerPageRootComponent(
      TestBed.inject(ActivatedRoute),
      alertsService,
      certificateAssessmentOfferingBackendApiService,
      classroomBackendApiServiceSpy,
      internetConnectivityService,
      {} as PageHeadService,
      router,
      translateService
    );

    component.ngOnInit();
    flushMicrotasks();

    expect(component.classroomUrlFragment).toBe('');
    expect(component.isLoading).toBe(false);
  }));

  it('should default to the intro stage', () => {
    expect(component.currentStage).toBe('intro');
  });

  it('should have the correct stage constants', () => {
    expect(CertificateAssessmentPlayerPageConstants.STAGE_INTRO).toBe('intro');
    expect(CertificateAssessmentPlayerPageConstants.STAGE_INSTRUCTIONS).toBe(
      'instructions'
    );
    expect(CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS).toBe(
      'questions'
    );
  });

  it('should initialize with isLoading true and hasError false', () => {
    expect(component.isLoading).toBe(true);
    expect(component.hasError).toBe(false);
  });

  it('should initialize attempt as null', () => {
    expect(component.attempt).toBeNull();
  });

  it('should initialize showAssessmentInterruptCard as false', () => {
    expect(component.showAssessmentInterruptCard).toBe(false);
  });

  it('should expose the certificateAssessmentPlayerPageConstants', () => {
    expect(component.certificateAssessmentPlayerPageConstants).toBe(
      CertificateAssessmentPlayerPageConstants
    );
  });
});
