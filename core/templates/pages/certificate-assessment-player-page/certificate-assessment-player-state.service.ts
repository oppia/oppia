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
 * @fileoverview Single source of truth for the learner's position in the
 * certificate assessment journey (intro -> instructions -> questions).
 *
 * Every "fresh start" decision lives here on purpose so that components
 * cannot drift apart: an attempt belongs to exactly one navigation lifecycle.
 * It is wiped once, when a replacement attempt successfully begins (see
 * `beginNewAttempt`), and never by mere navigation like retry or resume.
 */

import {Injectable} from '@angular/core';
import {CertificateAssessmentAttemptData} from 'domain/certificate-assessment/certificate-assessment.model';
import {
  CertificateAssessmentPlayerPageConstants,
  CertificateAssessmentStage,
} from './certificate-assessment-player-page.constants';

@Injectable()
export class CertificateAssessmentPlayerStateService {
  currentStage: CertificateAssessmentStage =
    CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  showAssessmentInterruptCard = false;

  private attempt: CertificateAssessmentAttemptData | null = null;

  /** Returns the attempt the learner is currently working on, if any. */
  getAttempt(): CertificateAssessmentAttemptData | null {
    return this.attempt;
  }

  /**
   * Marks the start of a brand-new attempt. This is the only place that
   * resets state, so a fresh attempt always starts clean and a failed
   * start request can never silently extend an old one.
   */
  beginNewAttempt(attempt: CertificateAssessmentAttemptData): void {
    this.attempt = attempt;
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
  }

  /** Shows the assessment instructions stage. */
  showInstructions(): void {
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_INSTRUCTIONS;
  }

  /** Returns the learner to the intro stage. */
  showIntro(): void {
    this.currentStage = CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  }

  /**
   * Handles "retry" after an interruption: the learner goes back to the
   * intro to start over. The old attempt only ends when the replacement
   * attempt begins (see `beginNewAttempt`); partial answers need no
   * explicit cleanup since they live inside the questions component, which
   * the stage change destroys along with them.
   */
  returnToIntroAfterRetry(): void {
    this.showAssessmentInterruptCard = false;
    this.showIntro();
  }

  /**
   * Handles "resume" after an interruption: the learner returns to the
   * questions of their existing attempt.
   */
  resumeQuestionsStage(): void {
    this.showAssessmentInterruptCard = false;
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
  }
}
