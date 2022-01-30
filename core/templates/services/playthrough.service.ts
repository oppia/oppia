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
import {
  CyclicStateTransitionsCustomizationArgs,
  EarlyQuitCustomizationArgs,
  MultipleIncorrectSubmissionsCustomizationArgs
} from 'domain/statistics/PlaythroughIssueObjectFactory';
import { LearnerAction, LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { Playthrough, PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { PlaythroughBackendApiService } from
  'domain/statistics/playthrough-backend-api.service';
import { ServicesConstants } from 'services/services.constants';
import { Stopwatch } from 'domain/utilities/stopwatch.model';

class CyclicStateTransitionsTracker {
  /** A path of visited states without any repeats. */
  private pathOfVisitedStates: string[];
  /** The most recently discovered cycle of visited states. */
  private cycleOfVisitedStates: string[];
  private numLoops: number;

  constructor(initStateName: string) {
    this.pathOfVisitedStates = [initStateName];
    this.cycleOfVisitedStates = [];
    this.numLoops = 0;
  }

  foundAnIssue(): boolean {
    return this.numLoops >= ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD;
  }

  /**
  * Records learner's transition to a new state into this tracker's path of
  * visited states.
  *
  * If appending the new state would introduce a duplicate state name, then a
  * cycle has been found. Specifically, if pushing the newest state (N) onto
  * the path would result in the following pattern:
  *
  *    [ ... , N , ... , N ]
  *
  * then we update this tracker's latest cycle discovery. The cycle is
  * definedcd
  * as the current path of visited states with all states prior to the first
  * occurrence of N discarded:
  *
  *    [ ... // N , ... , N ]  =>  [ N , ... , N ]
  *
  * If this *exact* cycle has been discovered before (NOTE: rotations of a
  * cycle are considered to be different from each other),then we increase the
  * tracked number of cycle occurrences.
  * Otherwise, the tracker is completely reset to 1.
  *
  * Finally, the path of visited states is reset to a value of [ N ], in hopes
  * that the exact same cycle is discovered enough times to be considered an
  * issue.
  */
  recordStateTransition(destStateName: string): void {
    if (this.currStateName() === destStateName) {
      return;
    }
    if (this.pathOfVisitedStates.includes(destStateName)) {
      const cycleOfVisitedStates = (
        this.makeCycle(this.pathOfVisitedStates.indexOf(destStateName)));
      if (angular.equals(this.cycleOfVisitedStates, cycleOfVisitedStates)) {
        this.numLoops += 1;
      } else {
        this.cycleOfVisitedStates = cycleOfVisitedStates;
        this.numLoops = 1;
      }
      this.pathOfVisitedStates.length = 0;
    }
    this.pathOfVisitedStates.push(destStateName);
  }

  generateIssueCustomizationArgs(): CyclicStateTransitionsCustomizationArgs {
    return {
      state_names: {value: this.cycleOfVisitedStates}
    };
  }

  private makeCycle(collisionIndex: number): string[] {
    const collision = this.pathOfVisitedStates[collisionIndex];
    const cycleWithNoCollision = (
      this.pathOfVisitedStates.slice(collisionIndex));
    return [...cycleWithNoCollision, collision];
  }

  private currStateName(): string {
    return this.pathOfVisitedStates[this.pathOfVisitedStates.length - 1];
  }
}

class EarlyQuitTracker {
  private stateName: string = ' ';
  private expDurationInSecs: number | null = null;

  foundAnIssue(): boolean {
    return (
      this.expDurationInSecs !== null &&
      this.expDurationInSecs < ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS);
  }

  recordExplorationQuit(
      stateName: string,
      expDurationInSecs: number | null
  ): void {
    if (this.stateName !== null && this.expDurationInSecs !== null) {
      this.stateName = stateName;
      this.expDurationInSecs = expDurationInSecs;
    }
  }


  generateIssueCustomizationArgs(): EarlyQuitCustomizationArgs {
    if (this.expDurationInSecs !== null) {
      return {
        state_name!: {value: this.stateName},
        time_spent_in_exp_in_msecs!: {value: this.expDurationInSecs * 1000},
      };
    } else {
      throw Error('Value expDurationInSecs should not be null!');
    }
  }
}

class MultipleIncorrectAnswersTracker {
  private currStateName: string;
  private numTries: number;

  constructor(initStateName: string) {
    this.currStateName = initStateName;
    this.numTries = 0;
  }

  foundAnIssue(): boolean {
    return this.numTries >= ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD;
  }

  recordStateTransition(destStateName: string): void {
    if (this.currStateName === destStateName) {
      this.numTries += 1;
    } else {
      this.currStateName = destStateName;
      this.numTries = 0;
    }
  }

  generateIssueCustomizationArgs(
  ): MultipleIncorrectSubmissionsCustomizationArgs {
    return {
      state_name: {value: this.currStateName},
      num_times_answered_incorrectly: {value: this.numTries},
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughService {
  private explorationId: string = ' ';
  private explorationVersion: number | null = null;
  private learnerIsInSamplePopulation: boolean | null = null;

  private eqTracker: EarlyQuitTracker | null = null;
  private cstTracker: CyclicStateTransitionsTracker | null = null;
  private misTracker: MultipleIncorrectAnswersTracker | null = null;
  private recordedLearnerActions: LearnerAction[] = [];
  private playthroughStopwatch: Stopwatch | null = null;
  private playthroughDurationInSecs: number | null = null;

  constructor(
      private explorationFeaturesService: ExplorationFeaturesService,
      private learnerActionObjectFactory: LearnerActionObjectFactory,
      private playthroughBackendApiService: PlaythroughBackendApiService,
      private playthroughObjectFactory: PlaythroughObjectFactory) {}

  initSession(
      explorationId: string,
      explorationVersion: number | null,
      sampleSizePopulationProportion: number
  ): void {
    this.explorationId = explorationId;
    this.explorationVersion = explorationVersion;
    this.learnerIsInSamplePopulation = (
      Math.random() < sampleSizePopulationProportion);
  }

  recordExplorationStartAction(initStateName: string): void {
    if (this.hasRecordingBegun() || !this.isPlaythroughRecordingEnabled()) {
      return;
    }

    this.recordedLearnerActions = [
      this.learnerActionObjectFactory.createNewExplorationStartAction({
        state_name: {value: initStateName},
      })
    ];

    this.eqTracker = new EarlyQuitTracker();
    this.misTracker = new MultipleIncorrectAnswersTracker(initStateName);
    this.cstTracker = new CyclicStateTransitionsTracker(initStateName);

    this.playthroughDurationInSecs = 0;
    this.playthroughStopwatch = Stopwatch.create();
    this.playthroughStopwatch.reset();
  }

  recordAnswerSubmitAction(
      stateName: string,
      destStateName: string,
      interactionId: string,
      answer: string,
      feedback: string,
      timeSpentInStateSecs: number
  ): void {
    if (!this.hasRecordingBegun() || this.hasRecordingFinished()) {
      return;
    }

    this.recordedLearnerActions.push(
      this.learnerActionObjectFactory.createNewAnswerSubmitAction({
        state_name: {value: stateName},
        dest_state_name: {value: destStateName},
        interaction_id: {value: interactionId},
        submitted_answer: {value: answer},
        feedback: {value: feedback},
        time_spent_state_in_msecs: {value: 1000 * timeSpentInStateSecs}
      }));
    if (this.misTracker !== null && this.cstTracker !== null) {
      this.misTracker.recordStateTransition(destStateName);
      this.cstTracker.recordStateTransition(destStateName);
    }
  }

  recordExplorationQuitAction(
      stateName: string, timeSpentInStateSecs: number
  ): void {
    if (!this.hasRecordingBegun() || this.hasRecordingFinished()) {
      return;
    }

    this.recordedLearnerActions.push(
      this.learnerActionObjectFactory.createNewExplorationQuitAction({
        state_name: {value: stateName},
        time_spent_in_state_in_msecs: {value: 1000 * timeSpentInStateSecs}
      }));
    if (this.playthroughStopwatch !== null && this.eqTracker !== null) {
      this.playthroughDurationInSecs = (
        this.playthroughStopwatch.getTimeInSecs());
      this.eqTracker.recordExplorationQuit(
        stateName, this.playthroughDurationInSecs);
    }
  }

  storePlaythrough(): void {
    if (this.isRecordedPlaythroughHelpful()) {
      const playthrough = this.createNewPlaythrough();
      if (playthrough !== null) {
        this.playthroughBackendApiService.storePlaythroughAsync(
          playthrough, 1);
      }
    }
  }

  /**
  * The ordering of checks in this method prioritizes the following types of
  * playthroughs:
  *    1. MultipleIncorrectSubmissionsIssue
  *    2. CyclicStateTransitionsIssue
  *    3. EarlyQuitIssue
  *
  * If none of the issue types have been discovered, returns null instead.
  */
  private createNewPlaythrough(): Playthrough | null {
    if (
      this.explorationVersion !== null &&
      this.recordedLearnerActions !== null
    ) {
      if (this.misTracker && this.misTracker.foundAnIssue()) {
        return this.playthroughObjectFactory
          .createNewMultipleIncorrectSubmissionsPlaythrough(
            this.explorationId, this.explorationVersion,
            this.misTracker.generateIssueCustomizationArgs(),
            this.recordedLearnerActions);
      } else if (this.cstTracker && this.cstTracker.foundAnIssue()) {
        return this.playthroughObjectFactory
          .createNewCyclicStateTransitionsPlaythrough(
            this.explorationId, this.explorationVersion,
            this.cstTracker.generateIssueCustomizationArgs(),
            this.recordedLearnerActions);
      } else if (this.eqTracker && this.eqTracker.foundAnIssue()) {
        return this.playthroughObjectFactory
          .createNewEarlyQuitPlaythrough(
            this.explorationId, this.explorationVersion,
            this.eqTracker.generateIssueCustomizationArgs(),
            this.recordedLearnerActions);
      }
      return null;
    }
    return null;
  }


  private isPlaythroughRecordingEnabled(): boolean {
    return (
      this.explorationFeaturesService.isPlaythroughRecordingEnabled() &&
      this.learnerIsInSamplePopulation === true);
  }

  private hasRecordingBegun(): boolean {
    return (
      this.isPlaythroughRecordingEnabled() &&
      this.recordedLearnerActions !== null
    );
  }

  private hasRecordingFinished(): boolean {
    (this.recordedLearnerActions !== null);
    return (
      this.hasRecordingBegun() &&
      this.recordedLearnerActions.length > 1 &&
      this.recordedLearnerActions[this.recordedLearnerActions.length - 1]
        .actionType === AppConstants.ACTION_TYPE_EXPLORATION_QUIT);
  }

  private isRecordedPlaythroughHelpful(): boolean {
    if (
      this.recordedLearnerActions !== null &&
      this.playthroughDurationInSecs !== null
    ) {
      return (
        // Playthroughs are only helpful in their entirety.
        this.hasRecordingFinished() &&
        // Playthroughs are only helpful if learners have attempted an answer.
            this.recordedLearnerActions.some(
              a => a.actionType === AppConstants.ACTION_TYPE_ANSWER_SUBMIT) &&
        // Playthroughs are only helpful if learners have invested enough time.
          this.playthroughDurationInSecs >=
            ServicesConstants.MIN_PLAYTHROUGH_DURATION_IN_SECS);
    } else {
      throw Error(
        'Value recordedLearnerActions and' +
         'playthroughDurationInSecs should not be null!');
    }
  }
}

angular.module('oppia').factory(
  'PlaythroughService',
  downgradeInjectable(PlaythroughService));
  