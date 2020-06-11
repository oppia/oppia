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
  public numTimesIncorrect: number = 0;

  constructor(initStateName: string) {
    this.currentStateName = initStateName;
  }

  public isIssue(): boolean {
    return (
      this.numTimesIncorrect >=
      ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD);
  }

  public recordStateTransition(destStateName: string): void {
    if (this.currentStateName === destStateName) {
      this.numTimesIncorrect += 1;
    } else {
      this.currentStateName = destStateName;
      this.numTimesIncorrect = 0;
    }
  }
}

class CyclicStateTransitionsTracker {
  public cycleString: string = '';
  public numCycles: number = 0;
  public visitedStates: string[];

  constructor(initStateName: string) {
    this.visitedStates = [initStateName];
  }

  private makeCycleString(cycleStartIndex: number): string {
    const collision = this.visitedStates[cycleStartIndex];
    const cycleWithoutCollision = this.visitedStates.slice(cycleStartIndex);
    return [...cycleWithoutCollision, collision].toString();
  }

  private latestState(): string {
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
    if (this.latestState() !== destStateName) {
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

@Injectable({
  providedIn: 'root'
})
export class PlaythroughService {
  private explorationId: string;
  private explorationVersion: number;
  private isLearnerInSamplePopulation: boolean;
  private timeSpentInExpInSecs: number;

  private playthrough: Playthrough;
  private stopwatch: Stopwatch;
  private multipleIncorrectAnswersTracker: MultipleIncorrectAnswersTracker;
  private cyclicStateTransitionsTracker: CyclicStateTransitionsTracker;

  constructor(
      private explorationFeaturesService: ExplorationFeaturesService,
      private learnerActionObjectFactory: LearnerActionObjectFactory,
      private playthroughBackendApiService: PlaythroughBackendApiService,
      private playthroughObjectFactory: PlaythroughObjectFactory,
      private stopwatchObjectFactory: StopwatchObjectFactory) {}

  private isEarlyQuitIssue(): boolean {
    return (
      this.timeSpentInExpInSecs !== null &&
      this.timeSpentInExpInSecs <
      ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS);
  }

  private analyzePlaythrough(): void {
    // The ordering of checks in this method is such that the priority of
    // issues to be recorded in case of multiple issues is captured. This
    // follows MultipleIncorrectSubmissionsIssue ->
    // CyclicStateTransitionsIssue -> EarlyQuitIssue.
    if (this.multipleIncorrectAnswersTracker.isIssue()) {
      this.playthrough.issueType = (
        AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS);
      this.playthrough.issueCustomizationArgs = {
        state_name: {
          value: this.multipleIncorrectAnswersTracker.currentStateName
        },
        num_times_answered_incorrectly: {
          value: this.multipleIncorrectAnswersTracker.numTimesIncorrect
        }
      };
    } else if (this.cyclicStateTransitionsTracker.isIssue()) {
      this.playthrough.issueType = (
        AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS);
      this.playthrough.issueCustomizationArgs = {
        state_names: {
          value: this.cyclicStateTransitionsTracker.cycleString.split(',')
        }
      };
    } else if (this.isEarlyQuitIssue()) {
      this.playthrough.issueType = AppConstants.ISSUE_TYPE_EARLY_QUIT;
      this.playthrough.issueCustomizationArgs = {
        state_name: {
          value: (
            this.playthrough.actions[this.playthrough.actions.length - 1]
              .action_customization_args.state_name.value)
        },
        time_spent_in_exp_in_secs: {
          value: this.timeSpentInExpInSecs
        }
      };
    }
  }

  private isRecordingPlaythrough(): boolean {
    return (
      this.explorationFeaturesService.isPlaythroughRecordingEnabled() &&
      this.isLearnerInSamplePopulation);
  }

  private isLearnerJustBrowsing(): boolean {
    if (this.playthrough !== null &&
        this.playthrough.actions.some(a => a.action_type === 'AnswerSubmit')) {
      // Learners who have entered an answer are probably not just browsing.
      return false;
    }
    if (this.timeSpentInExpInSecs >= 45) {
      // Learners who have spent at least 45 seconds in the exploration are
      // probably not just browsing.
      return false;
    }
    // Otherwise, yes the learner is probably just browsing.
    return true;
  }

  initSession(
      explorationId: string, explorationVersion: number,
      sampleSizeProportion: number): void {
    this.explorationId = explorationId;
    this.explorationVersion = explorationVersion;
    this.isLearnerInSamplePopulation = Math.random() < sampleSizeProportion;

    this.playthrough = null;
    this.multipleIncorrectAnswersTracker = null;
    this.cyclicStateTransitionsTracker = null;
  }

  getPlaythrough(): Playthrough {
    return this.playthrough;
  }

  recordExplorationStartAction(initStateName: string): void {
    if (!this.isRecordingPlaythrough()) {
      return;
    }

    let explorationStartAction = (
      this.learnerActionObjectFactory.createExplorationStartAction({
        state_name: {value: initStateName}
      }));
    this.playthrough = this.playthroughObjectFactory.createNew(
      null, this.explorationId, this.explorationVersion, null, {},
      [explorationStartAction]);

    this.multipleIncorrectAnswersTracker = (
      new MultipleIncorrectAnswersTracker(initStateName));
    this.cyclicStateTransitionsTracker = (
      new CyclicStateTransitionsTracker(initStateName));

    this.timeSpentInExpInSecs = 0;
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

    this.multipleIncorrectAnswersTracker.recordStateTransition(destStateName);
    this.cyclicStateTransitionsTracker.recordStateTransition(destStateName);

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

    this.timeSpentInExpInSecs = this.stopwatch.getTimeInSecs();

    const explorationQuitAction = (
      this.learnerActionObjectFactory.createExplorationQuitAction({
        state_name: {value: stateName},
        time_spent_in_state_in_msecs: {value: 1000 * timeSpentInStateSecs}
      }));
    this.playthrough.actions.push(explorationQuitAction);
  }

  recordPlaythrough(isExplorationComplete: boolean): void {
    if (isExplorationComplete ||
        this.playthrough === null ||
        this.playthrough.getLastAction().action_type !== 'ExplorationQuit') {
      return;
    }
    this.analyzePlaythrough();
    if (this.playthrough.issueType !== null && !this.isLearnerJustBrowsing()) {
      this.playthroughBackendApiService.storePlaythrough(this.playthrough);
    }
  }
}

angular.module('oppia').factory(
  'PlaythroughService',
  downgradeInjectable(PlaythroughService));
