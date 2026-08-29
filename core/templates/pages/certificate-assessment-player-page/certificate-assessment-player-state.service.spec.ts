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
 * @fileoverview Unit tests for CertificateAssessmentPlayerStateService.
 */

import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {
  CertificateAssessmentAttemptData,
  CertificateAssessmentOfferingData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';
import {CertificateAssessmentPlayerStateService} from './certificate-assessment-player-state.service';

describe('CertificateAssessmentPlayerStateService', () => {
  let service: CertificateAssessmentPlayerStateService;

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

  // The spies must call through so zone.js still schedules the interval on
  // the fakeAsync clock; they only exist to count invocations. They are
  // installed inside each test because installing them around the fakeAsync
  // boundary makes the spied properties unrecognizable to matchers.
  const spyOnTimers = (): void => {
    spyOn(window, 'setInterval').and.callThrough();
    spyOn(window, 'clearInterval').and.callThrough();
  };

  // Arms a fully running countdown: registers an attempt (which moves the
  // learner to the questions stage) and applies the offering's one-hour
  // time limit, which is what finally starts the interval.
  const armCountdown = (): void => {
    service.beginNewAttempt(mockAttempt);
    service.configureForOffering(mockOffering.timeLimitInMinutes);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CertificateAssessmentPlayerStateService],
    });
    service = TestBed.inject(CertificateAssessmentPlayerStateService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should initialize with a clean slate', () => {
    expect(service.currentStage).toBe(
      CertificateAssessmentPlayerPageConstants.STAGE_INTRO
    );
    expect(service.showAssessmentInterruptCard).toBeFalse();
    expect(service.remainingTimeInSeconds).toBe(0);
    expect(service.isTimeExpired).toBeFalse();
    expect(service.getAttempt()).toBeNull();
  });

  it('should expose the registered attempt', () => {
    service.beginNewAttempt(mockAttempt);
    expect(service.getAttempt()).toEqual(mockAttempt);
  });

  it('should switch stages through the intro and instructions steps', () => {
    service.showInstructions();
    expect(service.currentStage).toBe(
      CertificateAssessmentPlayerPageConstants.STAGE_INSTRUCTIONS
    );

    service.showIntro();
    expect(service.currentStage).toBe(
      CertificateAssessmentPlayerPageConstants.STAGE_INTRO
    );
  });

  describe('beginning a new attempt', () => {
    it('should move to the questions stage and start a fresh window', fakeAsync(() => {
      spyOnTimers();
      armCountdown();

      expect(service.currentStage).toBe(
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
      );
      expect(service.remainingTimeInSeconds).toBe(3600);
      expect(window.setInterval).toHaveBeenCalledTimes(1);

      tick(2000);
      expect(service.remainingTimeInSeconds).toBe(3598);
      service.ngOnDestroy();
    }));

    it('should derive the countdown from the deadline when callbacks are throttled', fakeAsync(() => {
      armCountdown();

      tick(60000);

      expect(service.remainingTimeInSeconds).toBe(3540);
      expect(service.isTimeExpired).toBeFalse();
      service.ngOnDestroy();
    }));

    it('should mark the window expired and stop at zero', fakeAsync(() => {
      spyOnTimers();
      armCountdown();

      tick(3600000);

      expect(service.remainingTimeInSeconds).toBe(0);
      expect(service.isTimeExpired).toBeTrue();
      expect(window.clearInterval).toHaveBeenCalled();
    }));

    it('should wipe stale timing state from any previous attempt', fakeAsync(() => {
      spyOnTimers();
      armCountdown();
      tick(3600000);
      expect(service.isTimeExpired).toBeTrue();

      armCountdown();

      expect(service.isTimeExpired).toBeFalse();
      expect(service.remainingTimeInSeconds).toBe(3600);
      expect(window.clearInterval).toHaveBeenCalled();
      expect(window.setInterval).toHaveBeenCalledTimes(2);
      service.ngOnDestroy();
    }));
  });

  describe('starting the countdown', () => {
    it('should not start before an attempt exists', () => {
      spyOnTimers();
      service.configureForOffering(mockOffering.timeLimitInMinutes);

      expect(window.setInterval).not.toHaveBeenCalled();
      expect(service.remainingTimeInSeconds).toBe(0);
    });

    it('should not start without a positive time limit', () => {
      spyOnTimers();
      service.beginNewAttempt(mockAttempt);
      service.configureForOffering(0);

      expect(window.setInterval).not.toHaveBeenCalled();
      expect(service.remainingTimeInSeconds).toBe(0);
    });

    it('should not start outside the questions stage', () => {
      spyOnTimers();
      service.beginNewAttempt(mockAttempt);
      service.showIntro();
      service.configureForOffering(mockOffering.timeLimitInMinutes);

      expect(window.setInterval).not.toHaveBeenCalled();
      expect(service.remainingTimeInSeconds).toBe(0);
    });

    it('should not restart a window that is already running', fakeAsync(() => {
      spyOnTimers();
      armCountdown();
      service.resumeQuestionsStage();
      service.configureForOffering(mockOffering.timeLimitInMinutes);

      expect(window.setInterval).toHaveBeenCalledTimes(1);

      tick(2000);
      expect(service.remainingTimeInSeconds).toBe(3598);
      service.ngOnDestroy();
    }));
  });

  describe('retry and resume after an interruption', () => {
    it('should return to the intro on retry without touching timing state', fakeAsync(() => {
      spyOnTimers();
      armCountdown();
      tick(3600000);
      expect(service.isTimeExpired).toBeTrue();
      service.showAssessmentInterruptCard = true;

      service.returnToIntroAfterRetry();

      expect(service.showAssessmentInterruptCard).toBeFalse();
      expect(service.currentStage).toBe(
        CertificateAssessmentPlayerPageConstants.STAGE_INTRO
      );
      // Retry deliberately leaves the expired window alone; only a
      // successfully begun replacement attempt resets it.
      expect(service.isTimeExpired).toBeTrue();
      expect(service.remainingTimeInSeconds).toBe(0);
      expect(window.clearInterval).toHaveBeenCalledTimes(1);
    }));

    it('should return to the questions on resume keeping the remaining time', fakeAsync(() => {
      armCountdown();
      tick(30000);
      service.showAssessmentInterruptCard = true;
      service.returnToIntroAfterRetry();

      service.resumeQuestionsStage();

      expect(service.showAssessmentInterruptCard).toBeFalse();
      expect(service.currentStage).toBe(
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
      );
      expect(service.isTimeExpired).toBeFalse();

      tick(2000);
      // The countdown kept running while the learner was away.
      expect(service.remainingTimeInSeconds).toBeLessThan(3600);
      service.ngOnDestroy();
    }));
  });

  it('should stop the countdown when destroyed', fakeAsync(() => {
    spyOnTimers();
    armCountdown();
    expect(service.remainingTimeInSeconds).toBe(3600);

    service.ngOnDestroy();
    tick(2000);

    expect(service.remainingTimeInSeconds).toBe(3600);
    expect(service.isTimeExpired).toBeFalse();
    expect(window.clearInterval).toHaveBeenCalled();
  }));

  it('should tolerate being destroyed without a running countdown', () => {
    spyOnTimers();
    expect(() => service.ngOnDestroy()).not.toThrowError();
    expect(window.clearInterval).not.toHaveBeenCalled();
  });
});
