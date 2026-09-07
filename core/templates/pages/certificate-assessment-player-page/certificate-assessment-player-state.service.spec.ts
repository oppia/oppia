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

import {TestBed} from '@angular/core/testing';
import {CertificateAssessmentAttemptData} from 'domain/certificate-assessment/certificate-assessment.model';
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';
import {CertificateAssessmentPlayerStateService} from './certificate-assessment-player-state.service';

describe('CertificateAssessmentPlayerStateService', () => {
  let service: CertificateAssessmentPlayerStateService;

  const mockAttempt = CertificateAssessmentAttemptData.createFromBackendDict({
    attempt_id: 'attempt-1234',
    questions: [
      {question_id: 'question_1', question_version: 1},
      {question_id: 'question_2', question_version: 2},
    ],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CertificateAssessmentPlayerStateService],
    });
    service = TestBed.inject(CertificateAssessmentPlayerStateService);
  });

  it('should initialize with a clean slate', () => {
    expect(service.currentStage).toBe(
      CertificateAssessmentPlayerPageConstants.STAGE_INTRO
    );
    expect(service.showAssessmentInterruptCard).toBeFalse();
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
    it('should move to the questions stage', () => {
      service.beginNewAttempt(mockAttempt);

      expect(service.currentStage).toBe(
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
      );
      expect(service.getAttempt()).toEqual(mockAttempt);
    });
  });

  describe('retry and resume after an interruption', () => {
    it('should return to the intro on retry', () => {
      service.beginNewAttempt(mockAttempt);
      service.showAssessmentInterruptCard = true;

      service.returnToIntroAfterRetry();

      expect(service.showAssessmentInterruptCard).toBeFalse();
      expect(service.currentStage).toBe(
        CertificateAssessmentPlayerPageConstants.STAGE_INTRO
      );
    });

    it('should return to the questions on resume', () => {
      service.beginNewAttempt(mockAttempt);
      service.showAssessmentInterruptCard = true;
      service.returnToIntroAfterRetry();

      service.resumeQuestionsStage();

      expect(service.showAssessmentInterruptCard).toBeFalse();
      expect(service.currentStage).toBe(
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
      );
    });
  });
});
