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

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {Subscription} from 'rxjs';

import {ContextService} from 'services/context.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  ReadOnlyExplorationBackendApiService,
  ReadOnlyExplorationBackendDict,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {CheckpointCelebrationUtilityService} from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ExplorationPlayerStateService} from 'pages/exploration-player-page/services/exploration-player-state.service';

import './checkpoint-celebration-modal.component.css';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

const MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS = 2200;
const MESSAGE_MODAL_APPROX_COMPLETE_ANIMATION_DURATION_MS = 15000;
const MINI_MESSAGE_MODAL_APPROX_COMPLETE_ANIMATION_DURATION_MS = 6500;
const SCREEN_WIDTH_FOR_STANDARD_SIZED_MESSAGE_MODAL_CUTOFF_PX = 1370;

@Component({
  selector: 'oppia-checkpoint-celebration-modal',
  templateUrl: './checkpoint-celebration-modal.component.html',
  styleUrls: ['./checkpoint-celebration-modal.component.css'],
})
export class CheckpointCelebrationModalComponent implements OnInit, OnDestroy {
  @ViewChild('checkpointCelebrationModalTimer')
  checkpointTimerTemplateRef!: ElementRef<SVGPolylineElement>;

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  checkpointStatusArray!: string[];
  oppiaAvatarImageUrl!: string;
  checkpointNodeFadeInDelays!: number[];
  orderedCheckpointList!: string[];
  checkpointStatusArrayPlaceholder!: string[];
  checkpointTimer: SVGPolylineElement | null = null;
  directiveSubscriptions = new Subscription();
  exploration: ReadOnlyExplorationBackendDict | undefined;
  hasViewedLessonInfoOnce: boolean | undefined;
  currentStateName: string | undefined;
  mostRecentlyReachedCheckpointStateName: string | null = null;
  translatedCurrentCheckpointMessage: string | null = null;
  translatedCurrentCheckpointMessageTitle: string | null = null;
  currentCheckpointPosition: number = 0;
  totalNumberOfCheckpoints: number = 0;
  checkpointNodesAreVisible: boolean = false;
  messageModalIsShown: boolean = false;
  messageModalIsDismissed: boolean = false;
  miniMessageTooltipIsShown: boolean = false;
  miniMessageTooltipIsDismissed: boolean = false;
  shouldDisplayFullScaleMessage: boolean = true;
  autoMessageDismissalTimeout: NodeJS.Timeout | undefined;

  constructor(
    private contextService: ContextService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private checkpointCelebrationUtilityService: CheckpointCelebrationUtilityService,
    private playerPositionService: PlayerPositionService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private platformFeatureService: PlatformFeatureService,
    private explorationPlayerStateService: ExplorationPlayerStateService
  ) {}

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.oppiaAvatarImageUrl =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );
    this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(this.explorationId, null)
      .then(response => {
        this.exploration = response.exploration;
        this.hasViewedLessonInfoOnce =
          response.has_viewed_lesson_info_modal_once;
        this.mostRecentlyReachedCheckpointStateName =
          response.most_recently_reached_checkpoint_state_name;

        this.orderedCheckpointList =
          this.checkpointCelebrationUtilityService.getStateListForCheckpointMessages(
            this.exploration.states,
            this.exploration.init_state_name
          );
        this.totalNumberOfCheckpoints = this.orderedCheckpointList.length;
        this.checkpointStatusArrayPlaceholder = new Array(
          this.totalNumberOfCheckpoints
        );
        this.checkpointStatusArray = new Array(this.totalNumberOfCheckpoints);
        this.checkpointNodeFadeInDelays = new Array(
          this.totalNumberOfCheckpoints
        );
        this.setFadeInDelaysForCheckpointNodes();
        this.currentStateName = this.exploration.init_state_name;
        this.subscribeToCardChangeEmitter();
      });
    this.shouldDisplayFullScaleMessage =
      this.windowDimensionsService.getWidth() >
      SCREEN_WIDTH_FOR_STANDARD_SIZED_MESSAGE_MODAL_CUTOFF_PX;
    this.subscribeToWindowResizeEmitter();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  subscribeToCardChangeEmitter(): void {
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (nextStateCard: StateCard) => {
          this.checkpointCelebrationUtilityService.setIsOnCheckpointedState(
            false
          );
          if (this.miniMessageTooltipIsShown) {
            this.dismissMiniMessage();
            setTimeout(() => {
              this.checkIfCheckpointMessageIsToBeTriggered(
                nextStateCard.getStateName()
              );
            }, MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS);
          } else if (this.messageModalIsShown) {
            this.dismissMessage();
            setTimeout(() => {
              this.checkIfCheckpointMessageIsToBeTriggered(
                nextStateCard.getStateName()
              );
            }, MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS);
          } else {
            this.checkIfCheckpointMessageIsToBeTriggered(
              nextStateCard.getStateName()
            );
          }
        }
      )
    );
  }

  subscribeToWindowResizeEmitter(): void {
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(() => {
        this.shouldDisplayFullScaleMessage =
          this.windowDimensionsService.getWidth() >
          SCREEN_WIDTH_FOR_STANDARD_SIZED_MESSAGE_MODAL_CUTOFF_PX;
      })
    );
  }

  checkIfCheckpointMessageIsToBeTriggered(newStateName: string): void {
    if (
      newStateName === this.currentStateName ||
      newStateName === this.mostRecentlyReachedCheckpointStateName ||
      !this.platformFeatureService.status.CheckpointCelebration.isEnabled ||
      !this.explorationPlayerStateService.isInStoryChapterMode()
    ) {
      return;
    }
    this.currentStateName = newStateName;
    let checkpointPos = this.orderedCheckpointList.indexOf(
      this.currentStateName
    );
    if (checkpointPos === -1 || checkpointPos === 0) {
      return;
    }
    if (!this.hasViewedLessonInfoOnce) {
      this.hasViewedLessonInfoOnce = true;
      return;
    }

    this.translatedCurrentCheckpointMessage =
      this.checkpointCelebrationUtilityService.getCheckpointMessage(
        checkpointPos,
        this.orderedCheckpointList.length
      );
    this.translatedCurrentCheckpointMessageTitle =
      this.checkpointCelebrationUtilityService.getCheckpointTitle();
    this.currentCheckpointPosition = checkpointPos;
    this.generateCheckpointStatusArray();

    this.checkpointCelebrationUtilityService.setIsOnCheckpointedState(true);
    if (this.shouldDisplayFullScaleMessage) {
      this.triggerStandardMessage();
    } else {
      this.triggerMiniMessage();
    }
  }

  generateCheckpointStatusArray(): void {
    for (let i = 0; i < this.currentCheckpointPosition; i++) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
    }
    if (this.totalNumberOfCheckpoints > this.currentCheckpointPosition) {
      this.checkpointStatusArray[this.currentCheckpointPosition] =
        CHECKPOINT_STATUS_IN_PROGRESS;
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
      (this.currentCheckpointPosition - 1) * spaceBetweenEachNode +
      spaceBetweenEachNode / 2
    );
  }

  setFadeInDelaysForCheckpointNodes(): void {
    for (let i = 0; i < this.totalNumberOfCheckpoints; i++) {
      this.checkpointNodeFadeInDelays[i] =
        i * (1.5 / this.totalNumberOfCheckpoints) + 2.2;
    }
  }

  triggerStandardMessage(): void {
    this.resetTimer();
    this.messageModalIsShown = true;
    this.autoMessageDismissalTimeout = setTimeout(() => {
      this.messageModalIsShown = false;
      this.checkpointNodesAreVisible = false;
    }, MESSAGE_MODAL_APPROX_COMPLETE_ANIMATION_DURATION_MS);
  }

  triggerMiniMessage(): void {
    this.miniMessageTooltipIsShown = true;
    setTimeout(() => {
      this.miniMessageTooltipIsShown = false;
    }, MINI_MESSAGE_MODAL_APPROX_COMPLETE_ANIMATION_DURATION_MS);
  }

  dismissMessage(): void {
    if (this.autoMessageDismissalTimeout) {
      clearTimeout(this.autoMessageDismissalTimeout);
    }
    this.messageModalIsShown = false;
    this.messageModalIsDismissed = true;
    this.checkpointNodesAreVisible = false;
    setTimeout(() => {
      this.messageModalIsDismissed = false;
    }, MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS);
  }

  dismissMiniMessage(): void {
    this.miniMessageTooltipIsShown = false;
    this.miniMessageTooltipIsDismissed = true;
    setTimeout(() => {
      this.miniMessageTooltipIsDismissed = false;
    }, MESSAGE_MODAL_APPROX_TRIGGER_AND_DISMISSAL_DURATION_MS);
  }

  resetTimer(): void {
    if (!this.shouldDisplayFullScaleMessage) {
      return;
    }
    this.checkpointTimer = this.checkpointTimerTemplateRef.nativeElement;
    // This function is meant to reset the timer SVG to its initial position,
    // i.e. completely filled. This needs to happen instantly, as opposed to the
    // depleting of the timer which happens over a 12 second (approx.) period.
    // Hence we set the transition duration to 0s, reset the stroke-dashoffset
    // to 0, and then set the transition duration back to 12s before changing
    // the stroke-dashoffset to 10, which begins the normal depleting of the
    // timer.
    // However, changing the transition duration to 0s isn't immediately
    // picked up by the browser and so the timer can still be seen animating up
    // to its initial position.
    // To force the browser to pick up this change, we need to trigger a reflow.
    // The clientHeight property is one of the properties that causes a
    // reflow.
    if (this.checkpointTimer) {
      this.checkpointTimer.style.transitionDuration = '0s';
      this.checkpointTimer.style.strokeDashoffset = '0';
      this.checkpointTimer.clientHeight;
      this.checkpointTimer.style.transitionDuration = '12.14s';
      this.checkpointTimer.clientHeight;
      if (this.isLanguageRTL()) {
        this.checkpointTimer.style.strokeDashoffset = '-10';
      } else {
        this.checkpointTimer.style.strokeDashoffset = '10';
      }
    }
  }

  openLessonInfoModal(): void {
    if (!this.platformFeatureService.status.CheckpointCelebration.isEnabled) {
      return;
    }
    this.checkpointCelebrationUtilityService.openLessonInformationModal();
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
