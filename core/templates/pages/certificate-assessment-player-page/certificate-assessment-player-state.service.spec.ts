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
import {StateBackendDict} from 'domain/state/state.model';
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';
import {CertificateAssessmentPlayerStateService} from './certificate-assessment-player-state.service';

describe('CertificateAssessmentPlayerStateService', () => {
  let service: CertificateAssessmentPlayerStateService;

  const mockStateData: StateBackendDict = {
    classifier_model_id: null,
    content: {content_id: 'c', html: '<p>prompt</p>'},
    interaction: {
      answer_groups: [],
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {value: 1},
        placeholder: {
          value: {content_id: 'ca_placeholder_0', unicode_str: 'Type here'},
        },
        catchMisspellings: {value: false},
      },
      default_outcome: {
        dest: 'final',
        dest_if_really_stuck: null,
        feedback: {content_id: 'f', html: '<p>f</p>'},
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      hints: [],
      id: 'TextInput',
      solution: null,
    },
    param_changes: [],
    solicit_answer_details: false,
    card_is_checkpoint: false,
    linked_skill_id: null,
    inapplicable_skill_misconception_ids: [],
  };

  const mockAttempt = CertificateAssessmentAttemptData.createFromBackendDict({
    attempt_id: 'attempt-1234',
    questions: [
      {
        question_id: 'question_1',
        question_version: 1,
        question_state_data: mockStateData,
      },
      {
        question_id: 'question_2',
        question_version: 2,
        question_state_data: mockStateData,
      },
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

  it('should move to the questions stage and register the attempt', () => {
    service.beginNewAttempt(mockAttempt);

    expect(service.currentStage).toBe(
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
    );
    expect(service.getAttempt()).toEqual(mockAttempt);
  });

  it('should replace the previous attempt when a new one begins', () => {
    service.beginNewAttempt(mockAttempt);

    const replacementAttempt =
      CertificateAssessmentAttemptData.createFromBackendDict({
        attempt_id: 'attempt-5678',
        questions: [
          {
            question_id: 'question_1',
            question_version: 1,
            question_state_data: mockStateData,
          },
        ],
      });
    service.beginNewAttempt(replacementAttempt);

    expect(service.getAttempt()).toEqual(replacementAttempt);
    expect(service.currentStage).toBe(
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
    );
  });
});
