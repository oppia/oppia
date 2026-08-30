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
 * certificate assessment journey (intro -> instructions -> questions) and
 * for the time window of their current attempt.
 *
 * Every "fresh start" decision lives here on purpose so that components
 * cannot drift apart: a timing window belongs to exactly one attempt. It
 * is wiped once, when a replacement attempt successfully begins (see
 * `beginNewAttempt`), and never by mere navigation like retry or resume.
 */

import {Injectable, OnDestroy} from '@angular/core';
import {CertificateAssessmentAttemptData} from 'domain/certificate-assessment/certificate-assessment.model';
import {
  CertificateAssessmentPlayerPageConstants,
  CertificateAssessmentStage,
} from './certificate-assessment-player-page.constants';

@Injectable()
export class CertificateAssessmentPlayerStateService implements OnDestroy {
  currentStage: CertificateAssessmentStage =
    CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  showAssessmentInterruptCard = false;
  remainingTimeInSeconds = 0;
  isTimeExpired = false;

  private attempt: CertificateAssessmentAttemptData | null = null;
  private timerId: number | null = null;
  private expiryTimestampMs: number | null = null;
  private hasStartedTimer = false;
  private timeLimitInSeconds = 0;

  /**
   * Remembers the offering's time limit so the countdown can be armed as
   * soon as both an attempt and its configuration are known. Also covers
   * learners who land directly on the session route: their attempt already
   * exists, so the timer starts here once the offering finally arrives.
   */
  configureForOffering(timeLimitInMinutes: number): void {
    this.timeLimitInSeconds = timeLimitInMinutes * 60;
    this.startTimerIfReady();
  }

  /** Returns the attempt the learner is currently working on, if any. */
  getAttempt(): CertificateAssessmentAttemptData | null {
    return this.attempt;
  }

  /**
   * Marks the start of a brand-new attempt. This is the only place that
   * resets timing state, so a fresh attempt always gets a full window and
   * a failed start request can never silently extend an old one.
   */
  beginNewAttempt(attempt: CertificateAssessmentAttemptData): void {
    this.attempt = attempt;
    this.resetTimerState();
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    this.startTimerIfReady();
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
   * intro to start over. Timing state is deliberately left untouched here,
   * because the old window only ends when the replacement attempt begins
   * (see `beginNewAttempt`); partial answers need no explicit cleanup since
   * they live inside the questions component, which the stage change
   * destroys along with them.
   */
  returnToIntroAfterRetry(): void {
    this.showAssessmentInterruptCard = false;
    this.showIntro();
  }

  /**
   * Handles "resume" after an interruption: the learner returns to the
   * questions of their existing attempt, picking up whatever time remains.
   */
  resumeQuestionsStage(): void {
    this.showAssessmentInterruptCard = false;
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    this.startTimerIfReady();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  /**
   * Starts the countdown if, and only if, everything it depends on is in
   * place: a known attempt, a positive time limit, the questions stage and
   * no window already running for this attempt.
   */
  private startTimerIfReady(): void {
    if (
      this.hasStartedTimer ||
      this.attempt === null ||
      this.timeLimitInSeconds <= 0 ||
      this.currentStage !==
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
    ) {
      return;
    }
    this.hasStartedTimer = true;
    // Derive the remaining time from an absolute deadline rather than
    // decrementing per callback, because browsers throttle intervals in
    // inactive tabs and would otherwise let the assessment run longer than
    // its configured duration.
    const expiryTimestampMs = Date.now() + this.timeLimitInSeconds * 1000;
    this.expiryTimestampMs = expiryTimestampMs;
    this.remainingTimeInSeconds = this.timeLimitInSeconds;
    this.timerId = window.setInterval(() => {
      this.remainingTimeInSeconds = Math.max(
        0,
        Math.ceil((expiryTimestampMs - Date.now()) / 1000)
      );
      if (this.remainingTimeInSeconds === 0) {
        this.isTimeExpired = true;
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Wipes all attempt-scoped timing state: the running interval, the
   * deadline, the displayed countdown and the expiry flag. Only ever
   * called while arming a replacement attempt.
   */
  private resetTimerState(): void {
    this.clearTimer();
    this.hasStartedTimer = false;
    this.isTimeExpired = false;
    this.remainingTimeInSeconds = 0;
    this.expiryTimestampMs = null;
  }
}
