// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for tracking Checkpoint state.
 */

import {Component, OnInit} from '@angular/core';
import './checkpoint-bar.component.css';
import {ExplorationEngineService} from '../../../services/exploration-engine.service';
import {StateObjectsBackendDict} from 'domain/exploration/states.model';
import {PlayerPositionService} from '../../../services/player-position.service';
import {Subscription} from 'rxjs';
import {PageContextService} from 'services/page-context.service';
import {CheckpointProgressService} from 'pages/exploration-player-page/services/checkpoint-progress.service';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

@Component({
  selector: 'oppia-checkpoint-bar',
  templateUrl: './checkpoint-bar.component.html',
  styleUrls: ['./checkpoint-bar.component.css'],
})
export class CheckpointBarComponent implements OnInit {
  explorationId!: string;
  expStates!: StateObjectsBackendDict;
  checkpointCount: number = 0;
  expEnded: boolean = false;
  directiveSubscriptions = new Subscription();
  completedCheckpointsCount!: number;
  checkpointStatusArray!: string[];
  checkpointIndexes: number[] = [];
  progressBarWidth: number = 0;
  maxStateDepth: number = 0;

  constructor(
    private explorationEngineService: ExplorationEngineService,
    private playerPositionService: PlayerPositionService,
    private pageContextService: PageContextService,
    private checkpointProgressService: CheckpointProgressService
  ) {}

  ngOnInit(): void {
    this.explorationId = this.pageContextService.getExplorationId();
    this.checkpointIndexes =
      this.checkpointProgressService.getCheckpointStates();
    this.maxStateDepth = this.explorationEngineService.getMaxStateDepth();

    this.checkpointCount =
      this.checkpointProgressService.fetchCheckpointCount();
    this.updateLessonProgressBar();

    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(() => {
        this.updateLessonProgressBar();
      })
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(() => {
        this.updateLessonProgressBar();
      })
    );
  }

  getCompletedProgressBarWidth(): number {
    const checkpointIndexes = this.checkpointIndexes;
    const displayedCardIndex =
      this.playerPositionService.getDisplayedCardIndex();
    const segmentWidth = 100 / this.checkpointCount;

    if (displayedCardIndex === checkpointIndexes[0]) {
      return 0; // No progress needed; it's the first checkpoint.
    }

    let state = this.explorationEngineService.getState();
    let stateCard = this.explorationEngineService.getStateCardByName(
      state.name as string
    );
    if (stateCard.isTerminal()) {
      return 100;
    }

    // Find the current segment between checkpoints.
    let currentSegmentIndex = 0;

    if (displayedCardIndex >= checkpointIndexes[checkpointIndexes.length - 1]) {
      currentSegmentIndex = checkpointIndexes.length - 1; // If at or beyond the last checkpoint, full progress.
    } else {
      for (let i = 0; i < checkpointIndexes.length - 1; i++) {
        if (
          displayedCardIndex >= checkpointIndexes[i] &&
          displayedCardIndex < checkpointIndexes[i + 1]
        ) {
          currentSegmentIndex = i;
          break;
        }
      }
    }
    const startIdx = checkpointIndexes[currentSegmentIndex];
    const endIdx =
      checkpointIndexes[currentSegmentIndex + 1] || this.maxStateDepth;

    const totalSteps = endIdx - startIdx;
    const stepsCompleted = displayedCardIndex - startIdx;

    const fractionInSegment = totalSteps > 0 ? stepsCompleted / totalSteps : 0;

    const baseWidth = currentSegmentIndex * segmentWidth;
    const additionalWidth = fractionInSegment * segmentWidth;

    return baseWidth + additionalWidth;
  }

  getProgressPercentage(): string {
    return this.progressBarWidth.toString();
  }

  updateLessonProgressBar(): void {
    this.progressBarWidth = this.getCompletedProgressBarWidth();
    let state = this.explorationEngineService.getState();
    let stateCard = this.explorationEngineService.getStateCardByName(
      state.name as string
    );
    if (!this.expEnded) {
      const mostRecentlyReachedCheckpointIndex =
        this.checkpointProgressService.getMostRecentlyReachedCheckpointIndex();
      this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

      let displayedCardIndex =
        this.playerPositionService.getDisplayedCardIndex();
      if (displayedCardIndex > 0) {
        if (stateCard.isTerminal()) {
          this.checkpointStatusArray[this.checkpointCount] =
            CHECKPOINT_STATUS_COMPLETED;
          this.completedCheckpointsCount += 1;
          this.expEnded = true;
        }
      }
    }

    // Mark the first checkpoint as completed.
    this.checkpointStatusArray = new Array(this.checkpointCount + 1);
    this.checkpointStatusArray[0] = CHECKPOINT_STATUS_COMPLETED;

    // Mark remaining checkpoints based on current progress.
    for (let i = 1; i < this.completedCheckpointsCount; i++) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
    }

    // If there are still incomplete checkpoints, mark the next checkpoint as "in-progress".
    if (this.checkpointCount > this.completedCheckpointsCount) {
      this.checkpointStatusArray[this.completedCheckpointsCount] =
        CHECKPOINT_STATUS_IN_PROGRESS;
    }

    // All remaining checkpoints are incomplete.
    for (
      let i = this.completedCheckpointsCount + 1;
      i < this.checkpointCount;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }

    if (!stateCard.isTerminal()) {
      this.checkpointStatusArray[this.checkpointCount] =
        CHECKPOINT_STATUS_INCOMPLETE;
    } else {
      this.checkpointStatusArray[this.checkpointCount] =
        CHECKPOINT_STATUS_COMPLETED;
    }
  }

  /**
   * If the checkpoint is completed, this function returns the user to the checkpoint.
   *
   * @param {number} checkpointNumber - The number of the checkpoint to return to.
   * @returns {void} This function does not return a value. It changes the displayed card if the checkpoint is completed.
   */
  returnToCheckpointIfCompleted(checkpointNumber: number): void {
    const checkpointCardIndexes = this.checkpointIndexes;
    const cardIndex = checkpointCardIndexes[checkpointNumber];

    if (
      this.checkpointStatusArray[checkpointNumber] !==
      CHECKPOINT_STATUS_COMPLETED
    ) {
      return;
    } else {
      this.playerPositionService.setDisplayedCardIndex(cardIndex);
      this.playerPositionService.onActiveCardChanged.emit();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  getCheckpointTooltip(index: number): string {
    const status = this.checkpointStatusArray[index];
    const checkpointNumber = index;

    switch (status) {
      case 'completed':
        return `Checkpoint ${checkpointNumber}: Completed`;
      case 'in-progress':
        return `Checkpoint ${checkpointNumber}: Next checkpoint`;
      case 'incomplete':
        return `Checkpoint ${checkpointNumber}: Locked`;
      default:
        return '';
    }
  }

  getCheckpointAriaLabel(index: number): string {
    return this.getCheckpointTooltip(index);
  }
}
