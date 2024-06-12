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
 * @fileoverview Component for lesson information card modal.
 */

import {Clipboard} from '@angular/cdk/clipboard';
import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {StateCard} from 'domain/state_card/state-card.model';
import {LearnerExplorationSummaryBackendDict} from 'domain/summary/learner-exploration-summary.model';
import {UrlService} from 'services/contextual/url.service';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LocalStorageService} from 'services/local-storage.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {ExplorationPlayerStateService} from 'pages/exploration-player-page/services/exploration-player-state.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {CheckpointCelebrationUtilityService} from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';

interface ExplorationTagSummary {
  tagsToShow: string[];
  tagsInTooltip: string[];
}

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';
const EXPLORATION_STATUS_PRIVATE = 'private';

import './lesson-information-card-modal.component.css';

@Component({
  selector: 'oppia-lesson-information-card-modal',
  templateUrl: './lesson-information-card-modal.component.html',
  styleUrls: ['./lesson-information-card-modal.component.css'],
})
export class LessonInformationCardModalComponent extends ConfirmOrCancelModal {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  expTitleTranslationKey!: string;
  expDescTranslationKey!: string;
  displayedCard!: StateCard;
  explorationId!: string;
  expTitle!: string;
  expDesc!: string;
  expCategory!: string;
  contributorNames!: string[];
  checkpointCount!: number;
  expInfo!: LearnerExplorationSummaryBackendDict;
  completedCheckpointsCount!: number;
  checkpointStatusArray!: string[];
  infoCardBackgroundCss!: {'background-color': string};
  infoCardBackgroundImageUrl!: string;
  averageRating!: number | null;
  numViews!: number;
  lastUpdatedString!: string;
  explorationIsPrivate!: boolean;
  explorationTags!: ExplorationTagSummary;
  // Unique progress tracking ID is null until the first state of the
  // exploration is loaded.
  loggedOutProgressUniqueUrlId!: string | null;
  loggedOutProgressUniqueUrl!: string;
  // The below property is defined only when the learner is on a
  // checkpointed state, and is undefined otherwise.
  translatedCongratulatoryCheckpointMessage!: string | undefined;
  userIsLoggedIn: boolean = false;
  lessonAuthorsSubmenuIsShown: boolean = false;
  saveProgressMenuIsShown: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService,
    private ratingComputationService: RatingComputationService,
    private dateTimeFormatService: DateTimeFormatService,
    private clipboard: Clipboard,
    private urlService: UrlService,
    private userService: UserService,
    private windowRef: WindowRef,
    private explorationEngineService: ExplorationEngineService,
    private playerTranscriptService: PlayerTranscriptService,
    private localStorageService: LocalStorageService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private checkpointCelebrationUtilityService: CheckpointCelebrationUtilityService,
    private playerPositionService: PlayerPositionService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.averageRating = this.ratingComputationService.computeAverageRating(
      this.expInfo.ratings
    );
    this.numViews = this.expInfo.num_views;
    this.lastUpdatedString = this.getLastUpdatedString(
      this.expInfo.last_updated_msec
    );
    this.explorationIsPrivate =
      this.expInfo.status === EXPLORATION_STATUS_PRIVATE;
    this.explorationTags = this.getExplorationTagsSummary(this.expInfo.tags);
    this.explorationId = this.expInfo.id;
    this.expTitle = this.expInfo.title;
    this.expCategory = this.expInfo.category;
    this.expDesc = this.expInfo.objective;
    this.infoCardBackgroundCss = {
      'background-color': this.expInfo.thumbnail_bg_color,
    };
    this.infoCardBackgroundImageUrl = this.expInfo.thumbnail_icon_url;

    this.expTitleTranslationKey =
      this.i18nLanguageCodeService.getExplorationTranslationKey(
        this.explorationId,
        TranslationKeyType.TITLE
      );
    this.expDescTranslationKey =
      this.i18nLanguageCodeService.getExplorationTranslationKey(
        this.explorationId,
        TranslationKeyType.DESCRIPTION
      );

    // This array is used to keep track of the status of each checkpoint,
    // i.e. whether it is completed, in-progress, or yet-to-be-completed by the
    // learner. This information is then used to display the progress bar
    // in the lesson info card.
    this.checkpointStatusArray = new Array(this.checkpointCount);
    for (let i = 0; i < this.completedCheckpointsCount; i++) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
    }
    // If not all checkpoints are completed, then the checkpoint immediately
    // following the last completed checkpoint is labeled 'in-progress'.
    if (this.checkpointCount > this.completedCheckpointsCount) {
      this.checkpointStatusArray[this.completedCheckpointsCount] =
        CHECKPOINT_STATUS_IN_PROGRESS;
    }
    for (
      let i = this.completedCheckpointsCount + 1;
      i < this.checkpointCount;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }
    this.loggedOutProgressUniqueUrlId =
      this.explorationPlayerStateService.getUniqueProgressUrlId();
    if (this.loggedOutProgressUniqueUrlId) {
      this.loggedOutProgressUniqueUrl =
        this.urlService.getOrigin() +
        '/progress/' +
        this.loggedOutProgressUniqueUrlId;
    }
    if (this.checkpointCelebrationUtilityService.getIsOnCheckpointedState()) {
      this.translatedCongratulatoryCheckpointMessage =
        this.checkpointCelebrationUtilityService.getCheckpointMessage(
          this.completedCheckpointsCount,
          this.checkpointCount
        );
    }
  }

  getCompletedProgressBarWidth(): number {
    if (this.completedCheckpointsCount === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.checkpointCount - 1);
    return (
      (this.completedCheckpointsCount - 1) * spaceBetweenEachNode +
      spaceBetweenEachNode / 2
    );
  }

  getProgressPercentage(): string {
    if (this.completedCheckpointsCount === this.checkpointCount) {
      return '100';
    }
    if (this.completedCheckpointsCount === 0) {
      return '0';
    }
    const progressPercentage = Math.floor(
      (this.completedCheckpointsCount / this.checkpointCount) * 100
    );
    return progressPercentage.toString();
  }

  getExplorationTagsSummary(arrayOfTags: string[]): ExplorationTagSummary {
    let tagsToShow = [];
    let tagsInTooltip = [];
    let MAX_CHARS_TO_SHOW = 45;

    for (let i = 0; i < arrayOfTags.length; i++) {
      const newLength = (tagsToShow.toString() + arrayOfTags[i]).length;

      if (newLength < MAX_CHARS_TO_SHOW) {
        tagsToShow.push(arrayOfTags[i]);
      } else {
        tagsInTooltip.push(arrayOfTags[i]);
      }
    }

    return {
      tagsToShow: tagsToShow,
      tagsInTooltip: tagsInTooltip,
    };
  }

  getLastUpdatedString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch
    );
  }

  getStaticImageUrl(imageUrl: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imageUrl);
  }

  isHackyExpTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isHackyExpDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  async saveLoggedOutProgress(): Promise<void> {
    if (!this.loggedOutProgressUniqueUrlId) {
      this.explorationPlayerStateService.setUniqueProgressUrlId().then(() => {
        this.loggedOutProgressUniqueUrlId =
          this.explorationPlayerStateService.getUniqueProgressUrlId();
        this.loggedOutProgressUniqueUrl =
          this.urlService.getOrigin() +
          '/progress/' +
          this.loggedOutProgressUniqueUrlId;
      });
    }
    this.saveProgressMenuIsShown = true;
  }

  onLoginButtonClicked(): void {
    this.userService.getLoginUrlAsync().then(loginUrl => {
      let urlId = this.loggedOutProgressUniqueUrlId;
      if (urlId === null) {
        throw new Error(
          'User should not be able to login if ' +
            'loggedOutProgressUniqueUrlId is not null.'
        );
      }
      this.localStorageService.updateUniqueProgressIdOfLoggedOutLearner(urlId);
      this.windowRef.nativeWindow.location.href = loginUrl;
    });
  }

  /**
   * Retrieves the indexes of cards that are marked as checkpoints.
   *
   * @returns {number[]} An array of indexes of cards. Each index corresponds to a card that is a checkpoint.
   */
  getCheckpointCardIndexes(): number[] {
    const checkpointCardIndexes: number[] = [];
    const numberOfCards = this.playerTranscriptService.getNumCards();

    for (let i = 0; i < numberOfCards; i++) {
      const stateName = this.playerTranscriptService.getCard(i).getStateName();
      const correspondingState =
        this.explorationEngineService.getStateFromStateName(stateName);
      if (correspondingState.cardIsCheckpoint) {
        checkpointCardIndexes.push(i);
      }
    }
    return checkpointCardIndexes;
  }

  /**
   * If the checkpoint is completed, this function returns the user to the checkpoint.
   *
   * @param {number} checkpointNumber - The number of the checkpoint to return to.
   * @returns {void} This function does not return a value. It changes the displayed card if the checkpoint is completed.
   */
  returnToCheckpointIfCompleted(checkpointNumber: number): void {
    const checkpointCardIndexes = this.getCheckpointCardIndexes();
    const cardIndex = checkpointCardIndexes[checkpointNumber];

    if (cardIndex === undefined) {
      console.error('No card index associated with this checkpoint.');
    }
    if (
      this.checkpointStatusArray[checkpointNumber] !==
      CHECKPOINT_STATUS_COMPLETED
    ) {
      return;
    } else {
      this.playerPositionService.setDisplayedCardIndex(cardIndex);
      this.playerPositionService.onActiveCardChanged.emit();
      this.ngbActiveModal.close();
    }
  }

  closeSaveProgressMenu(): void {
    this.saveProgressMenuIsShown = false;
  }
}
