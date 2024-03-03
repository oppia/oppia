// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the new lesson player footer
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { InteractionSpecsConstants, InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { Subscription } from 'rxjs';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ExplorationPlayerConstants } from '../../exploration-player-page.constants';
import { ExplorationPlayerStateService } from '../../services/exploration-player-state.service';
import { PlayerTranscriptService } from '../../services/player-transcript.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { ContentTranslationManagerService } from '../../services/content-translation-manager.service';
import { ProgressReminderModalComponent } from 'pages/exploration-player-page/templates/progress-reminder-modal.component';

import './player-footer.component.css';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';
import { ExplorationEngineService } from 'pages/exploration-player-page/services/exploration-engine.service';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { ContextService } from 'services/context.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { LearnerViewInfoBackendApiService } from 'pages/exploration-player-page/services/learner-view-info-backend-api.service';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { LocalStorageService } from 'services/local-storage.service';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

@Component({
  selector: 'oppia-new-lesson-player-footer',
  templateUrl: './player-footer.component.html',
  styleUrls: ['./player-footer.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition('void => *', []),
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('1s ease', keyframes([
          style({ opacity: 0 }),
          style({ opacity: 1 })
        ]))
      ])
    ])
  ]
})
export class PlayerFooterComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() displayedCard!: StateCard;
  @Input() submitButtonIsShown!: boolean;
  @Input() showContinueToReviseButton!: boolean;
  @Input() navigationThroughCardHistoryIsEnabled!: boolean;
  @Input() skipButtonIsShown!: boolean;
  displayedCardIndex!: number;
  hasPrevious!: boolean;
  hasNext!: boolean;
  conceptCardIsBeingShown!: boolean;
  interactionCustomizationArgs!: InteractionCustomizationArgs | null;
  interactionId!: string | null;
  helpCardHasContinueButton!: boolean;
  lastDisplayedCard!: StateCard;
  explorationId!: string;
  newCardStateName!: string;
  currentCardIndex!: number;
  checkpointCount: number = 0;
  completedCheckpointsCount!: number;
  checkpointStatusArray: string[] = [];
  translatedCongratulatoryCheckpointMessage!: string | undefined;
  expStates: StateObjectsBackendDict;
  expEnded: boolean = false;
  expInfo: LearnerExplorationSummaryBackendDict;
  userIsLoggedIn: boolean = false;
  // Unique progress tracking ID is null until the first state of the
  // exploration is loaded.
  loggedOutProgressUniqueUrlId!: string | null;
  loggedOutProgressUniqueUrl!: string;
  saveProgressMenuIsShown: boolean = false;

  @Output() submit: EventEmitter<void> = (
    new EventEmitter());

  @Output() clickContinueButton: EventEmitter<void> = (
    new EventEmitter());

  @Output() clickContinueToReviseButton: EventEmitter<void> = (
    new EventEmitter());

  @Output() changeCard: EventEmitter<number> = new EventEmitter();

  @Output() skipQuestion: EventEmitter<void> = new EventEmitter();

  directiveSubscriptions = new Subscription();
  transcriptLength: number = 0;
  interactionIsInline: boolean = true;
  CONTINUE_BUTTON_FOCUS_LABEL: string = (
    ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL);

  SHOW_SUBMIT_INTERACTIONS_ONLY_FOR_MOBILE: string[] = [
    'ItemSelectionInput', 'MultipleChoiceInput'];

  constructor(
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private focusManagerService: FocusManagerService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private urlService: UrlService,
    private userService: UserService,
    private schemaFormSubmittedService: SchemaFormSubmittedService,
    private windowDimensionsService: WindowDimensionsService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private explorationEngineService: ExplorationEngineService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private contextService: ContextService,
    private learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService,
    private editableExplorationBackendApiService:
      EditableExplorationBackendApiService,
    private ngbModal: NgbModal,
    private loggerService: LoggerService,
    private windowRef: WindowRef,
    private localStorageService: LocalStorageService,
  ) {}

  ngOnChanges(): void {
    if (this.lastDisplayedCard !== this.displayedCard) {
      this.lastDisplayedCard = this.displayedCard;
      this.updateDisplayedCardInfo();
    }
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();

    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });

    this.directiveSubscriptions.add(
      this.playerPositionService.onHelpCardAvailable.subscribe(
        (helpCard) => {
          this.helpCardHasContinueButton = helpCard.hasContinueButton;
        }
      )
    );
    this.directiveSubscriptions.add(
      this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.subscribe(
        () => {
          this.submit.emit();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.contentTranslationManagerService.onStateCardContentUpdate.subscribe(
        () => {
          this.updateDisplayedCardInfo();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(
        () => {
          this.updateLessonProgressBar();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        () => {
          this.updateLessonProgressBar();
        }
      )
    );
    this.directiveSubscriptions.add(
      this.playerPositionService.onLoadedMostRecentCheckpoint.subscribe(() => {
        if (this.checkpointCount) {
          this.showProgressReminderModal();
        } else {
          this.getCheckpointCount().then(() => {
            this.showProgressReminderModal();
          });
        }
      })
    );
  
    this.getCheckpointCount().then(() => {
      this.updateLessonProgressBar();
    });

    this.loggedOutProgressUniqueUrlId = (
      this.explorationPlayerStateService.getUniqueProgressUrlId());
    if (this.loggedOutProgressUniqueUrlId) {
      this.loggedOutProgressUniqueUrl = (
        this.urlService.getOrigin() +
        '/progress/' + this.loggedOutProgressUniqueUrlId);
    }
  }

  updateLessonProgressBar(): void {
    if(!this.expEnded) {
      const mostRecentlyReachedCheckpointIndex = (
        this.getMostRecentlyReachedCheckpointIndex()
      );
      this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

      let displayedCardIndex = (
        this.playerPositionService.getDisplayedCardIndex()
      );
      if (displayedCardIndex > 0) {
        let state = this.explorationEngineService.getState();
        let stateCard = this.explorationEngineService.getStateCardByName(
          state.name);
        if (stateCard.isTerminal()) {
          this.completedCheckpointsCount += 1;
          this.expEnded = true;
        }
      }
    }
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
      this.checkpointStatusArray[this.completedCheckpointsCount] = (
        CHECKPOINT_STATUS_IN_PROGRESS);
    }
    for (
      let i = this.completedCheckpointsCount + 1;
      i < this.checkpointCount;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }
  }

  showProgressReminderModal(): void {
    const mostRecentlyReachedCheckpointIndex = (
      this.getMostRecentlyReachedCheckpointIndex()
    );

    this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

    if (this.completedCheckpointsCount === 0) {
      this.explorationPlayerStateService.onShowProgressModal.emit();
      return;
    }

    if (this.expInfo) {
      this.openProgressReminderModal();
    } else {
      let stringifiedExpIds = JSON.stringify(
        [this.explorationId]);
      let includePrivateExplorations = JSON.stringify(true);

      this.learnerViewInfoBackendApiService.fetchLearnerInfoAsync(
        stringifiedExpIds,
        includePrivateExplorations
      ).then((response) => {
        this.expInfo = response.summaries[0];
        this.openProgressReminderModal();
      }, () => {
        this.loggerService.error(
          'Information card failed to load for exploration ' +
          this.explorationId);
      });
    }
  }

  openProgressReminderModal(): void {
    let modalRef = this.ngbModal.open(ProgressReminderModalComponent, {
      windowClass: 'oppia-progress-reminder-modal'
    });
    this.explorationPlayerStateService.onShowProgressModal.emit();

    let displayedCardIndex = (
      this.playerPositionService.getDisplayedCardIndex()
    );
    if (displayedCardIndex > 0) {
      let state = this.explorationEngineService.getState();
      let stateCard = this.explorationEngineService.getStateCardByName(
        state.name);
      if (stateCard.isTerminal()) {
        this.completedCheckpointsCount += 1;
      }
    }

    modalRef.componentInstance.checkpointCount = this.checkpointCount;
    modalRef.componentInstance.completedCheckpointsCount = (
      this.completedCheckpointsCount);
    modalRef.componentInstance.explorationTitle = this.expInfo.title;

    modalRef.result.then(() => {
      // This callback is used for when the learner chooses to restart
      // the exploration.
      this.editableExplorationBackendApiService.resetExplorationProgressAsync(
        this.explorationId).then(() => {
        this.windowRef.nativeWindow.location.reload();
      });
    }, () => {
      // This callback is used for when the learner chooses to resume
      // the exploration.
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  updateDisplayedCardInfo(): void {
    this.transcriptLength = this.playerTranscriptService.getNumCards();
    this.displayedCardIndex = (
      this.playerPositionService.getDisplayedCardIndex());
    this.hasPrevious = this.displayedCardIndex > 0;
    this.hasNext = !this.playerTranscriptService.isLastCard(
      this.displayedCardIndex);
    this.explorationPlayerStateService.isInQuestionMode();

    this.conceptCardIsBeingShown = (
      this.displayedCard.getStateName() === null &&
        !this.explorationPlayerStateService.isPresentingIsolatedQuestions()
    );

    if (!this.conceptCardIsBeingShown) {
      this.interactionIsInline = this.displayedCard.isInteractionInline();
      this.interactionCustomizationArgs = this.displayedCard
        .getInteractionCustomizationArgs();
      this.interactionId = this.displayedCard.getInteractionId();

      if (this.interactionId === 'Continue') {
        // To ensure that focus is added after all functions
        // in main thread are completely executed.
        setTimeout(() => {
          this.focusManagerService.setFocusWithoutScroll('continue-btn');
        }, 0);
      }
    }
    this.helpCardHasContinueButton = false;
    this.newCardStateName = this.displayedCard.getStateName();
  }

  doesInteractionHaveNavSubmitButton(): boolean {
    try {
      return (
        Boolean(this.interactionId) &&
        InteractionSpecsConstants.INTERACTION_SPECS[
          this.interactionId as InteractionSpecsKey
        ].show_generic_submit_button);
    // We use unknown type because we are unsure of the type of error
    // that was thrown. Since the catch block cannot identify the
    // specific type of error, we are unable to further optimise the
    // code by introducing more types of errors.
    } catch (e: unknown) {
      let additionalInfo = (
        '\nSubmit button debug logs:\ninterationId: ' +
        this.interactionId);
      if (e instanceof Error) {
        e.message += additionalInfo;
      }
      throw e;
    }
  }

  validateIndexAndChangeCard(index: number): void {
    if (index >= 0 && index < this.transcriptLength) {
      this.changeCard.emit(index);
    } else {
      throw new Error('Target card index out of bounds.');
    }
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX;
  }

  shouldGenericSubmitButtonBeShown(): boolean {
    return (this.doesInteractionHaveNavSubmitButton() && (
      this.interactionIsInline ||
      !this.canWindowShowTwoCards()
    ));
  }

  shouldContinueButtonBeShown(): boolean {
    if (this.conceptCardIsBeingShown) {
      return true;
    }

    return Boolean(
      this.interactionIsInline &&
      this.displayedCard.isCompleted() &&
      this.displayedCard.getLastOppiaResponse());
  }

  handleNewContinueButtonClick(): void {
    if (this.hasNext && this.navigationThroughCardHistoryIsEnabled) {
      this.validateIndexAndChangeCard(this.displayedCardIndex + 1);
    } else if (!this.hasNext) {
      if (this.shouldContinueButtonBeShown()) {
        this.clickContinueButton.emit();
      } else if (!this.shouldContinueButtonBeShown() && this.showContinueToReviseButton) {
        this.clickContinueToReviseButton.emit();
      }
    }
  }

  getCompletedProgressBarWidth(): number {
    if (this.completedCheckpointsCount === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.checkpointCount - 1);
    return (
      ((this.completedCheckpointsCount - 1) * spaceBetweenEachNode) +
      (spaceBetweenEachNode / 2));
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

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  getMostRecentlyReachedCheckpointIndex(): number {
    let checkpointIndex = 0;
    let numberOfCards = this.playerTranscriptService.getNumCards();
    for (let i = 0; i < numberOfCards; i++) {
      let stateName = this.playerTranscriptService.getCard(i).getStateName();
      let correspondingState = this.explorationEngineService.
        getStateFromStateName(stateName);
      if (correspondingState.cardIsCheckpoint) {
        checkpointIndex++;
      }
    }
    return checkpointIndex;
  }

  async getCheckpointCount(): Promise<void> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(this.explorationId, null).then(
        (response: FetchExplorationBackendResponse) => {
          this.expStates = response.exploration.states;
          let count = 0;
          for (let [, value] of Object.entries(this.expStates)) {
            if (value.card_is_checkpoint) {
              count++;
            }
          }
          this.checkpointCount = count;
        });
  }

  async saveLoggedOutProgress(): Promise<void> {
    if (!this.loggedOutProgressUniqueUrlId) {
      this.explorationPlayerStateService
        .setUniqueProgressUrlId()
        .then(() => {
          this.loggedOutProgressUniqueUrlId = (
            this.explorationPlayerStateService.getUniqueProgressUrlId());
          this.loggedOutProgressUniqueUrl = (
            this.urlService.getOrigin() +
            '/progress/' + this.loggedOutProgressUniqueUrlId);
        });
    }
    this.saveProgressMenuIsShown = true;
  }

  onLoginButtonClicked(): void {
    this.userService.getLoginUrlAsync().then(
      (loginUrl) => {
        let urlId = this.loggedOutProgressUniqueUrlId;
        if (urlId === null) {
          throw new Error(
            'User should not be able to login if ' +
            'loggedOutProgressUniqueUrlId is not null.');
        }
        this.localStorageService.updateUniqueProgressIdOfLoggedOutLearner(
          urlId);
        this.windowRef.nativeWindow.location.href = loginUrl;
      });
  }

  closeSaveProgressMenu(): void {
    this.saveProgressMenuIsShown = false;
  }
}

angular.module('oppia').directive('oppiaPlayerFooter',
  downgradeComponent({
    component: PlayerFooterComponent
  }) as angular.IDirectiveFactory);
