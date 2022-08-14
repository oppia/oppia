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
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ReadOnlyExplorationBackendApiService, ReadOnlyExplorationBackendDict } from 'domain/exploration/read-only-exploration-backend-api.service';
import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { StateCard } from 'domain/state_card/state-card.model';

import './checkpoint-celebration-modal.component.css';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

const MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS = 2200;
const MESSAGE_MODAL_APPROX_COMPLETE_ANIMATION_DURATION_MS = 15000;

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

  translatedCurrentCheckpointMessage: string | null = null;
  translatedCurrentCheckpointMessageTitle: string | null = null;
  currentCheckpointPosition: number = 0;
  totalNumberOfCheckpoints: number = 0;
  checkpointStatusArrayPlaceholder!: string[];
  checkpointStatusArray!: string[];
  checkpointNodeFadeInDelays!: number[];
  checkpointNodesAreVisible: boolean = false;
  messageModalIsShown: boolean = false;
  messageModalIsDismissed: boolean = false;
  autoMessageDismissalTimeout: NodeJS.Timeout | undefined;
  oppiaAvatarImageUrl: string;

  constructor(
    private contextService: ContextService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private checkpointCelebrationUtilityService:
      CheckpointCelebrationUtilityService,
    private playerPositionService: PlayerPositionService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.oppiaAvatarImageUrl = (
      this.urlInterpolationService
        .getStaticImageUrl('/avatar/oppia_avatar_100px.svg'));
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      this.explorationId, null).then((response) => {
      this.exploration = response.exploration;
      this.hasViewedLessonInfoOnce = response.has_viewed_lesson_info_modal_once;
      this.mostRecentlyReachedCheckpointStateName = (
        response.most_recently_reached_checkpoint_state_name);

      this.orderedCheckpointList = this.checkpointCelebrationUtilityService
        .getStateListForCheckpointMessages(
          this.exploration.states, this.exploration.init_state_name);
      this.totalNumberOfCheckpoints = this.orderedCheckpointList.length;
      this.checkpointStatusArrayPlaceholder = new Array(
        this.totalNumberOfCheckpoints);
      this.checkpointStatusArray = new Array(this.totalNumberOfCheckpoints);
      this.checkpointNodeFadeInDelays = new Array(
        this.totalNumberOfCheckpoints);
      this.setFadeInDelaysForCheckpointNodes();
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
          if (this.messageModalIsShown) {
            this.dismissMessage();
            setTimeout(() => {
              this.checkIfCheckpointMessageIsToBeTriggered(
                nextStateCard.getStateName());
            }, MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS);
          } else {
            this.checkIfCheckpointMessageIsToBeTriggered(
              nextStateCard.getStateName());
          }
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
    this.currentStateName = newStateName;
    let checkpointPos = this.orderedCheckpointList.indexOf(
      this.currentStateName);
    if (checkpointPos === -1 || checkpointPos === 0) {
      return;
    }
    if (!this.hasViewedLessonInfoOnce) {
      this.hasViewedLessonInfoOnce = true;
      return;
    }

    this.translatedCurrentCheckpointMessage = (
      this.checkpointCelebrationUtilityService.getCheckpointMessage(
        checkpointPos, this.orderedCheckpointList.length));
    this.translatedCurrentCheckpointMessageTitle = (
      this.checkpointCelebrationUtilityService.getCheckpointTitle());
    this.currentCheckpointPosition = checkpointPos;
    this.generateCheckpointStatusArray();

    this.triggerMessage();
  }

  generateCheckpointStatusArray(): void {
    for (let i = 0; i < this.currentCheckpointPosition; i++) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
    }
    if (this.totalNumberOfCheckpoints > this.currentCheckpointPosition) {
      this.checkpointStatusArray[this.currentCheckpointPosition] = (
        CHECKPOINT_STATUS_IN_PROGRESS);
    }
    for (
      let i = this.currentCheckpointPosition + 1;
      i < this.totalNumberOfCheckpoints;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }
    this.checkpointNodesAreVisible = true;
  }

  getCompletedProgressBarWidth(): number {
    if (!this.messageModalIsShown || this.messageModalIsDismissed) {
      return 0;
    }
    if (this.currentCheckpointPosition === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.totalNumberOfCheckpoints - 1);
    return (
      ((this.currentCheckpointPosition - 1) * spaceBetweenEachNode) +
      (spaceBetweenEachNode / 2));
  }

  setFadeInDelaysForCheckpointNodes(): void {
    for (let i = 0; i < this.totalNumberOfCheckpoints; i++) {
      this.checkpointNodeFadeInDelays[i] = (
        i * (1.5 / this.totalNumberOfCheckpoints) + 2.2);
    }
  }

  triggerMessage(): void {
    this.messageModalIsShown = true;
    this.autoMessageDismissalTimeout = setTimeout(() => {
      this.messageModalIsShown = false;
      this.checkpointNodesAreVisible = false;
    }, MESSAGE_MODAL_APPROX_COMPLETE_ANIMATION_DURATION_MS);
  }

  dismissMessage(): void {
    clearTimeout(this.autoMessageDismissalTimeout);
    this.messageModalIsShown = false;
    this.messageModalIsDismissed = true;
    this.checkpointNodesAreVisible = false;
    setTimeout(() => {
      this.messageModalIsDismissed = false;
    }, MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
