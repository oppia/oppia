// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the checkpoint celebration modal.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ContextService } from 'services/context.service';
import { ReadOnlyExplorationBackendApiService, ReadOnlyExplorationBackendDict } from 'domain/exploration/read-only-exploration-backend-api.service';
import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { StateCard } from 'domain/state_card/state-card.model';

import './checkpoint-celebration-modal.component.css';

@Component({
  selector: 'oppia-checkpoint-celebration-modal',
  templateUrl: './checkpoint-celebration-modal.component.html',
})
export class CheckpointCelebrationModalComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  explorationId!: string;
  exploration: ReadOnlyExplorationBackendDict | undefined;
  hasViewedLessonInfoOnce: boolean | undefined;
  orderedCheckpointList: string[]| undefined;
  currentStateName: string | undefined;
  mostRecentlyReachedCheckpointStateName: string | null;

  currentCheckpointMessage: string | null = null;
  currentCheckpointMessageTitle: string | null = null;
  messageModalIsShown: boolean = false;
  messageModalIsDismissed: boolean = false;
  autoMessageDismissalTimeout: NodeJS.Timeout | undefined;

  constructor(
    private contextService: ContextService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private checkpointCelebrationUtilityService:
      CheckpointCelebrationUtilityService,
    private playerPositionService: PlayerPositionService
  ) {}

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      this.explorationId, null).then((response) => {
      this.exploration = response.exploration;
      this.hasViewedLessonInfoOnce = response.has_viewed_lesson_info_modal_once;
      this.mostRecentlyReachedCheckpointStateName = (
        response.most_recently_reached_checkpoint_state_name);

      this.orderedCheckpointList = this.checkpointCelebrationUtilityService
        .getStateListForCheckpointMessages(
          this.exploration.states, this.exploration.init_state_name);
      this.currentStateName = this.exploration.init_state_name;
      this.subscribeToCardChangeEmitter();
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  subscribeToCardChangeEmitter(): void {
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (nextStateCard: StateCard) => {
          this.checkIfCheckpointMessageIsToBeTriggered(
            nextStateCard.getStateName());
        }
      )
    );
  }

  checkIfCheckpointMessageIsToBeTriggered(newStateName: string): void {
    if (
      newStateName === this.currentStateName ||
      newStateName === this.mostRecentlyReachedCheckpointStateName
    ) {
      return;
    }
    let checkpointPos = this.orderedCheckpointList.indexOf(
      this.currentStateName);
    if (checkpointPos === -1) {
      this.currentStateName = newStateName;
      return;
    }
    if (!this.hasViewedLessonInfoOnce) {
      this.hasViewedLessonInfoOnce = true;
      return;
    }

    checkpointPos += 1;
    this.currentCheckpointMessage = this.checkpointCelebrationUtilityService
      .getCheckpointMessage(checkpointPos, this.orderedCheckpointList.length);
    this.currentCheckpointMessageTitle = (
      this.checkpointCelebrationUtilityService.getCheckpointTitle());
    this.triggerMessage();
    this.currentStateName = newStateName;
  }

  triggerMessage(): void {
    this.messageModalIsShown = true;
    this.autoMessageDismissalTimeout = setTimeout(() => {
      this.messageModalIsShown = false;
    }, 15000);
  }

  dismissMessage(): void {
    clearTimeout(this.autoMessageDismissalTimeout);
    this.messageModalIsShown = false;
    this.messageModalIsDismissed = true;
    setTimeout(() => {
      this.messageModalIsDismissed = false;
    }, 2500);
  }
}
