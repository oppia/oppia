// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for recording and scrutinizing playthroughs.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { Playthrough, PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { PlaythroughBackendApiService } from
  'services/playthrough-backend-api.service';
import { ServicesConstants } from 'services/services.constants';
import { Stopwatch, StopwatchObjectFactory } from
  'domain/utilities/StopwatchObjectFactory';

class MultipleIncorrectAnswersTracker {
  public currentStateName: string;
  public numTries: number = 0;

  constructor(initStateName: string) {
    this.currentStateName = initStateName;
  }

  public isIssue(): boolean {
    return this.numTries >= ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD;
  }

  public recordStateTransition(destStateName: string): void {
    if (this.currentStateName === destStateName) {
      this.numTries += 1;
    } else {
      this.currentStateName = destStateName;
      this.numTries = 0;
    }
  }
}

class CyclicStateTransitionsTracker {
  public visitedStates: string[];
  public cycleString: string = null;
  public numCycles: number = 0;

  constructor(initStateName: string) {
    this.visitedStates = [initStateName];
  }

  private makeCycleString(cycleStartIndex: number): string {
    const collision = this.visitedStates[cycleStartIndex];
    const cycleWithoutCollision = this.visitedStates.slice(cycleStartIndex);
    return [...cycleWithoutCollision, collision].join(', ');
  }

  private currentStateName(): string {
    return this.visitedStates[this.visitedStates.length - 1];
  }

  isIssue(): boolean {
    return this.numCycles >= ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD;
  }

  recordStateTransition(destStateName: string): void {
    if (!this.visitedStates.includes(destStateName)) {
      this.visitedStates.push(destStateName);
      return;
    }
    if (this.currentStateName() !== destStateName) {
      const cycleString = (
        this.makeCycleString(this.visitedStates.indexOf(destStateName)));
      if (this.cycleString === cycleString) {
        this.numCycles += 1;
      } else {
        this.cycleString = cycleString;
        this.numCycles = 1;
      }
    }
    this.visitedStates = [destStateName];
  }
}

class EarlyQuitTracker {
  constructor(private timeSpentInStateSecs: number = null) {}

  isIssue(): boolean {
    return (
      this.timeSpentInStateSecs !== null &&
      this.timeSpentInStateSecs < ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS
    );
  }

  recordExplorationQuit(timeSpentInStateSecs: number): void {
    this.timeSpentInStateSecs = timeSpentInStateSecs;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughService {
  private explorationId?: string = null;
  private explorationVersion?: number = null;
  private isLearnerInSamplePopulation?: boolean = null;

  private eqTracker?: EarlyQuitTracker = null;
  private cstTracker?: CyclicStateTransitionsTracker = null;
  private miaTracker?: MultipleIncorrectAnswersTracker = null;
  private playthrough?: Playthrough = null;
  private stopwatch?: Stopwatch = null;
  private expDurationInSecs?: number = null;

  constructor(
      private explorationFeaturesService: ExplorationFeaturesService,
      private learnerActionObjectFactory: LearnerActionObjectFactory,
      private playthroughBackendApiService: PlaythroughBackendApiService,
      private playthroughObjectFactory: PlaythroughObjectFactory,
      private stopwatchObjectFactory: StopwatchObjectFactory) {}

  /**
   * The ordering of checks in this method prioritizes the following types of
   * playthroughs:
   *    1. MultipleIncorrectSubmissionsIssue
   *    2. CyclicStateTransitionsIssue
   *    3. EarlyQuitIssue
   */
  private classifyPlaythrough(): void {
    if (this.miaTracker !== null && this.miaTracker.isIssue()) {
      this.playthrough.issueType = (
        AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS);
      this.playthrough.issueCustomizationArgs = {
        state_name: {value: this.miaTracker.currentStateName},
        num_times_answered_incorrectly: {value: this.miaTracker.numTries}
      };
    } else if (this.cstTracker !== null && this.cstTracker.isIssue()) {
      this.playthrough.issueType = (
        AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS);
      this.playthrough.issueCustomizationArgs = {
        state_names: {value: this.cstTracker.cycleString.split(', ')}
      };
    } else if (this.eqTracker !== null && this.eqTracker.isIssue()) {
      const lastStateName = (
        this.playthrough.getLastAction()
          .action_customization_args.state_name.value);
      this.playthrough.issueType = AppConstants.ISSUE_TYPE_EARLY_QUIT;
      this.playthrough.issueCustomizationArgs = {
        state_name: {value: lastStateName},
        time_spent_in_exp_in_secs: {value: this.expDurationInSecs}
      };
    }
  }

  private isPlaythroughRecordingEnabled(): boolean {
    return (
      this.explorationFeaturesService.isPlaythroughRecordingEnabled() &&
      this.isLearnerInSamplePopulation === true);
  }

  private isLearnerJustBrowsing(): boolean {
    return (
      // Learners who never enter an answer are probably just browsing.
      !this.playthrough.actions.some(a => a.action_type === 'AnswerSubmit') ||
      // Learners who leave the exploration quickly are probably just browsing.
      this.expDurationInSecs < 45);
  }

  initSession(
      explorationId: string, explorationVersion: number,
      sampleSizePopulationProportion: number): void {
    this.explorationId = explorationId;
    this.explorationVersion = explorationVersion;
    this.isLearnerInSamplePopulation = (
      Math.random() < sampleSizePopulationProportion);
  }

  getPlaythrough(): Playthrough {
    return this.playthrough;
  }

  recordExplorationStartAction(initStateName: string): void {
    if (!this.isPlaythroughRecordingEnabled()) {
      return;
    }
    if (this.playthrough !== null) {
      return;
    }

    const explorationStartAction = (
      this.learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: initStateName}
      }));
    this.playthrough = this.playthroughObjectFactory.createNew(
      null, this.explorationId, this.explorationVersion, null, null,
      [explorationStartAction]);

    this.eqTracker = new EarlyQuitTracker();
    this.miaTracker = new MultipleIncorrectAnswersTracker(initStateName);
    this.cstTracker = new CyclicStateTransitionsTracker(initStateName);

    this.expDurationInSecs = 0;
    this.stopwatch = this.stopwatchObjectFactory.create();
    this.stopwatch.reset();
  }

  recordAnswerSubmitAction(
      stateName: string, destStateName: string, interactionId: string,
      answer: string, feedback: string, timeSpentInStateSecs: number): void {
    if (this.playthrough === null ||
        this.playthrough.getLastAction().action_type === 'ExplorationQuit') {
      return;
    }

    this.miaTracker.recordStateTransition(destStateName);
    this.cstTracker.recordStateTransition(destStateName);

    const answerSubmitAction = (
      this.learnerActionObjectFactory.createAnswerSubmitAction({
        state_name: {value: stateName},
        dest_state_name: {value: destStateName},
        interaction_id: {value: interactionId},
        submitted_answer: {value: answer},
        feedback: {value: feedback},
        time_spent_state_in_msecs: {value: 1000 * timeSpentInStateSecs}
      }));
    this.playthrough.actions.push(answerSubmitAction);
  }

  recordExplorationQuitAction(
      stateName: string, timeSpentInStateSecs: number): void {
    if (this.playthrough === null ||
        this.playthrough.getLastAction().action_type === 'ExplorationQuit') {
      return;
    }

    this.expDurationInSecs = this.stopwatch.getTimeInSecs();
    this.eqTracker.recordExplorationQuit(timeSpentInStateSecs);

    const explorationQuitAction = (
      this.learnerActionObjectFactory.createExplorationQuitAction({
        state_name: {value: stateName},
        time_spent_in_state_in_msecs: {value: 1000 * timeSpentInStateSecs}
      }));
    this.playthrough.actions.push(explorationQuitAction);

    this.classifyPlaythrough();
  }

  storePlaythrough(): void {
    if (this.playthrough === null || this.playthrough.issueType === null) {
      return;
    }
    if (this.isLearnerJustBrowsing()) {
      return;
    }
    this.playthroughBackendApiService.storePlaythrough(this.playthrough);
  }
}

angular.module('oppia').factory(
  'PlaythroughService',
  downgradeInjectable(PlaythroughService));
