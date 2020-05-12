// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { Playthrough, PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { ServicesConstants } from 'services/services.constants';
import { Stopwatch, StopwatchObjectFactory } from
  'domain/utilities/StopwatchObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface MultipleIncorrectStateNames {
  // eslint-disable-next-line camelcase
  state_name: string;
  // eslint-disable-next-line camelcase
  num_times_incorrect: number;
}
interface CycleIdentifier {
  cycle: string;
  // eslint-disable-next-line camelcase
  num_cycles: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughService {
  constructor(
    private http: HttpClient,
    private explorationFeaturesService: ExplorationFeaturesService,
    private learnerActionObjectFactory: LearnerActionObjectFactory,
    private playthroughObjectFactory: PlaythroughObjectFactory,
    private stopwatchObjectFactory: StopwatchObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

    playthrough: Playthrough = null;
    expStopwatch: Stopwatch = null;
    isLearnerInSamplePopulation: boolean = null;
    multipleIncorrectStateName: MultipleIncorrectStateNames = {
      state_name: null,
      num_times_incorrect: null
    };
    cycleIdentifier: CycleIdentifier = {
      cycle: null,
      num_cycles: null
    };
    visitedStates: string[] = [];
    misTracker: boolean = false;
    cstTracker: boolean = false;

    private removeOldQuitAction(): void {
      var quitAction = this.playthrough.actions[
        this.playthrough.actions.length - 1];
      // After the second quit action is recorded, the first quit is removed
      // using this method. This ensures that there are only two quit actions
      // in the playthrough actions list at a time.
      this.playthrough.actions = this.playthrough.actions.filter(
        (action) => {
          return (
            action.actionType !== AppConstants.ACTION_TYPE_EXPLORATION_QUIT);
        });
      this.playthrough.actions.push(quitAction);
    }

    private determineIfLearnerIsInSamplePopulation(
        probability: number): boolean {
      return Math.random() < probability;
    }

    private createMultipleIncorrectIssueTracker(initStateName: string): void {
      if (this.misTracker) {
        return;
      }
      this.multipleIncorrectStateName = {
        state_name: initStateName,
        num_times_incorrect: 0
      };
      this.misTracker = true;
    }

    private createCyclicIssueTracker(initStateName: string): void {
      if (this.cstTracker) {
        return;
      }
      this.cycleIdentifier = {
        cycle: '',
        num_cycles: 0
      };
      this.visitedStates.unshift(initStateName);
      this.cstTracker = true;
    }

    private incrementIncorrectAnswerInMultipleIncorrectIssueTracker(): void {
      this.multipleIncorrectStateName.num_times_incorrect += 1;
    }

    private recordStateTransitionInMultipleIncorrectIssueTracker(
        destStateName: string): void {
      if (this.multipleIncorrectStateName.num_times_incorrect <
        ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD) {
        this.multipleIncorrectStateName.state_name = destStateName;
        this.multipleIncorrectStateName.num_times_incorrect = 0;
      }
    }

    private recordStateTransitionInCyclicIssueTracker(
        destStateName: string): void {
      if (this.cycleIdentifier.num_cycles <
        ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD) {
        if (this.visitedStates.indexOf(destStateName) !== -1) {
          // Cycle identified.
          var cycleStartIndex = this.visitedStates.indexOf(destStateName);
          this.visitedStates.push(destStateName);
          var cycleString = this.visitedStates.slice(
            cycleStartIndex, this.visitedStates.length
          ).toString();
          if (this.cycleIdentifier.cycle === cycleString) {
            this.cycleIdentifier.num_cycles += 1;
          } else {
            this.cycleIdentifier.cycle = cycleString;
            this.cycleIdentifier.num_cycles = 1;
          }
          this.visitedStates = [destStateName];
        } else {
          this.visitedStates.push(destStateName);
        }
      }
    }

    private isMultipleIncorrectSubmissionsIssue(): boolean {
      return this.multipleIncorrectStateName.num_times_incorrect >=
        ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD;
    }

    private isCyclicStateTransitionsIssue(): boolean {
      return this.cycleIdentifier.num_cycles >=
        ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD;
    }

    private isEarlyQuitIssue(timeSpentInExpInSecs: number): boolean {
      return timeSpentInExpInSecs <
        ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS;
    }

    private analyzePlaythrough(): void {
      // The ordering of checks in this method is such that the priority of
      // issues to be recorded in case of multiple issues is captured. This
      // follows MultipleIncorrectSubmissionsIssue ->
      // CyclicStateTransitionsIssue -> EarlyQuitIssue.
      var timeSpentInExpInSecs = this.expStopwatch.getTimeInSecs();
      if (this.isMultipleIncorrectSubmissionsIssue()) {
        this.playthrough.issueType = (
          AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS);
        this.playthrough.issueCustomizationArgs = {
          state_name: {
            value: this.multipleIncorrectStateName.state_name
          },
          num_times_answered_incorrectly: {
            value: this.multipleIncorrectStateName.num_times_incorrect
          }
        };
      } else if (this.isCyclicStateTransitionsIssue()) {
        this.playthrough.issueType = (
          AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS);
        this.playthrough.issueCustomizationArgs = {
          state_names: {
            value: this.cycleIdentifier.cycle.split(',')
          }
        };
      } else if (this.isEarlyQuitIssue(timeSpentInExpInSecs)) {
        this.playthrough.issueType = AppConstants.ISSUE_TYPE_EARLY_QUIT;
        this.playthrough.issueCustomizationArgs = {
          state_name: {
            value:
              this.playthrough.actions[
                this.playthrough.actions.length - 1].actionCustomizationArgs
                .state_name.value
          },
          time_spent_in_exp_in_secs: {
            value: timeSpentInExpInSecs
          }
        };
      }
    }

    private storePlaythrough(isNewPlaythrough: boolean): void {
      var playthroughId = (
        isNewPlaythrough ? null : this.playthrough.playthroughId);
      var promise = this.http.post(this.getFullPlaythroughUrl(), {
        playthrough_data: this.playthrough.toBackendDict(),
        issue_schema_version: ServicesConstants.CURRENT_ISSUE_SCHEMA_VERSION,
        playthrough_id: playthroughId
      }).toPromise();
      if (isNewPlaythrough) {
        promise.then((
            response: {
                // eslint-disable-next-line camelcase
                playthrough_stored: boolean, playthrough_id: string }) => {
          if (response.playthrough_stored) {
            // In cases where maximum number of playthroughs already exists, the
            // above flag is not True and playthrough ID is not set.
            this.playthrough.playthroughId = response.playthrough_id;
          }
        });
      }
    }

    private getFullPlaythroughUrl(): string {
      return this.urlInterpolationService.interpolateUrl(
        ServicesConstants.STORE_PLAYTHROUGH_URL, {
          exploration_id: this.playthrough.expId
        });
    }

    private isPlaythroughDiscarded(): boolean {
      return !this.explorationFeaturesService.isPlaythroughRecordingEnabled() ||
        !this.isLearnerInSamplePopulation;
    }

    initSession(
        explorationId: string, explorationVersion: number,
        playthroughProbability: number): void {
      this.isLearnerInSamplePopulation =
        this.determineIfLearnerIsInSamplePopulation(playthroughProbability);
      this.playthrough = this.playthroughObjectFactory.createNew(
        null, explorationId, explorationVersion, null, {}, []);
      this.expStopwatch = this.stopwatchObjectFactory.create();
    }

    getPlaythrough(): Playthrough {
      return this.playthrough;
    }

    recordExplorationStartAction(initStateName: string): void {
      if (this.isPlaythroughDiscarded()) {
        return;
      }
      var expStartLearnerAction = this.learnerActionObjectFactory.createNew(
        AppConstants.ACTION_TYPE_EXPLORATION_START,
        {
          state_name: {
            value: initStateName
          }
        },
        ServicesConstants.CURRENT_ACTION_SCHEMA_VERSION);

      this.playthrough.actions.unshift(expStartLearnerAction);

      this.createMultipleIncorrectIssueTracker(initStateName);

      this.createCyclicIssueTracker(initStateName);

      this.expStopwatch.reset();
    }

    recordAnswerSubmitAction(
        stateName: string, destStateName: string, interactionId: string,
        answer: string, feedback: string,
        timeSpentInStateSecs: number): void {
      if (this.isPlaythroughDiscarded()) {
        return;
      }
      if (!this.cstTracker) {
        this.createCyclicIssueTracker(stateName);
      }
      if (!this.misTracker) {
        this.createMultipleIncorrectIssueTracker(stateName);
      }
      this.playthrough.actions.push(this.learnerActionObjectFactory.createNew(
        AppConstants.ACTION_TYPE_ANSWER_SUBMIT,
        {
          state_name: {
            value: stateName
          },
          dest_state_name: {
            value: destStateName
          },
          interaction_id: {
            value: interactionId
          },
          submitted_answer: {
            value: answer
          },
          feedback: {
            value: feedback
          },
          time_spent_state_in_msecs: {
            value: timeSpentInStateSecs
          }
        },
        ServicesConstants.CURRENT_ACTION_SCHEMA_VERSION
      ));

      var didNotMoveToNextState = (destStateName === stateName);
      if (didNotMoveToNextState) {
        this.incrementIncorrectAnswerInMultipleIncorrectIssueTracker();
      } else {
        this.recordStateTransitionInMultipleIncorrectIssueTracker(
          destStateName);
        this.recordStateTransitionInCyclicIssueTracker(destStateName);
      }
    }

    recordExplorationQuitAction(
        stateName: string, timeSpentInStateSecs: number): void {
      if (this.isPlaythroughDiscarded()) {
        return;
      }
      this.playthrough.actions.push(this.learnerActionObjectFactory.createNew(
        AppConstants.ACTION_TYPE_EXPLORATION_QUIT,
        {
          state_name: {
            value: stateName
          },
          time_spent_in_state_in_msecs: {
            value: timeSpentInStateSecs
          }
        },
        ServicesConstants.CURRENT_ACTION_SCHEMA_VERSION
      ));
    }

    recordPlaythrough(isExplorationComplete: boolean): void {
      if (this.isPlaythroughDiscarded()) {
        return;
      }
      if (isExplorationComplete) {
        // If the exploration is completed, do not check for issues.
        return;
      }
      if (this.playthrough.playthroughId) {
        // Playthrough ID exists, so issue has already been identified.
        this.removeOldQuitAction();
        if (this.playthrough.issueType === AppConstants.ISSUE_TYPE_EARLY_QUIT) {
          // If the existing issue is of type early quit, and some other issue
          // can be identified, update the issue since early quit has lower
          // priority.
          this.analyzePlaythrough();
        }
        this.storePlaythrough(false);
      } else {
        // Playthrough ID doesn't exist.
        this.analyzePlaythrough();
        if (this.playthrough.issueType) {
          // Issue type exists, so an issue is identified after analyzing the
          // playthrough, and the playthrough is stored.
          this.storePlaythrough(true);
        }
      }
    }
}
angular.module('oppia').factory('PlaythroughService',
  downgradeInjectable(PlaythroughService));
