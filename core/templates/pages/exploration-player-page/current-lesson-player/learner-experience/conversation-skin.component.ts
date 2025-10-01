// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the conversation skin.
 */

import {Subscription} from 'rxjs';
import {StateCard} from 'domain/state_card/state-card.model';
import {ChangeDetectorRef, Component, Input} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {CurrentInteractionService} from '../../services/current-interaction.service';
import {ExplorationRecommendationsService} from '../../services/exploration-recommendations.service';
import {HintsAndSolutionManagerService} from '../../services/hints-and-solution-manager.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {ImagePreloaderService} from '../../services/image-preloader.service';
import {LearnerAnswerInfoService} from '../../services/learner-answer-info.service';
import {LearnerParamsService} from '../../services/learner-params.service';
import {LoaderService} from 'services/loader.service';
import {PlayerPositionService} from '../../services/player-position.service';
import {PlayerTranscriptService} from '../../services/player-transcript.service';
import {QuestionPlayerEngineService} from '../../services/question-player-engine.service';
import {ReadOnlyCollectionBackendApiService} from 'domain/collection/read-only-collection-backend-api.service';
import {StatsReportingService} from '../../services/stats-reporting.service';
import {UrlService} from 'services/contextual/url.service';
import {UserService} from 'services/user.service';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ExplorationInitializationService} from '../../services/exploration-initialization.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {CollectionPlayerBackendApiService} from 'pages/collection-player-page/services/collection-player-backend-api.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ConversationFlowService} from '../../services/conversation-flow.service';
import {CheckpointProgressService} from '../../services/checkpoint-progress.service';
import './conversation-skin.component.css';
import {ConceptCardManagerService} from '../../services/concept-card-manager.service';
import {DiagnosticTestPlayerEngineService} from 'pages/exploration-player-page/services/diagnostic-test-player-engine.service';
import {ExplorationModeService} from 'pages/exploration-player-page/services/exploration-mode.service';
import {ChapterProgressService} from 'pages/exploration-player-page/services/chapter-progress.service';
import {CurrentEngineService} from 'pages/exploration-player-page/services/current-engine.service';
import {CardAnimationService} from 'pages/exploration-player-page/services/card-animation.service';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';

@Component({
  selector: 'oppia-conversation-skin',
  templateUrl: './conversation-skin.component.html',
  styleUrls: ['./conversation-skin.component.css'],
})
export class ConversationSkinComponent {
  @Input() questionPlayerConfig;
  @Input() diagnosticTestTopicTrackerModel;
  directiveSubscriptions = new Subscription();

  _editorPreviewMode;

  isLoggedIn: boolean;
  voiceoversAreLoaded: boolean = false;
  collectionTitle: string;
  explorationId: string;
  isIframed: boolean;
  OPPIA_AVATAR_IMAGE_URL: string;
  correctnessFooterIsShown: boolean = true;

  collectionSummary;
  moveToExploration: boolean;

  pidInUrl: string;
  submitButtonIsDisabled = true;
  isLearnerReallyStuck: boolean = false;
  showInteraction: boolean = true;

  // Finalized state for the component.
  continueToReviseStateButtonIsVisible: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private changeDetectorRef: ChangeDetectorRef,
    private collectionPlayerBackendApiService: CollectionPlayerBackendApiService,
    private pageContextService: PageContextService,
    private currentInteractionService: CurrentInteractionService,
    private explorationRecommendationsService: ExplorationRecommendationsService,
    private explorationModeService: ExplorationModeService,
    private cardAnimationService: CardAnimationService,
    private explorationInitializationService: ExplorationInitializationService,
    private hintsAndSolutionManagerService: HintsAndSolutionManagerService,
    private conceptCardManagerService: ConceptCardManagerService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private imagePreloaderService: ImagePreloaderService,
    private learnerAnswerInfoService: LearnerAnswerInfoService,
    private learnerParamsService: LearnerParamsService,
    private loaderService: LoaderService,
    private localStorageService: LocalStorageService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private readOnlyCollectionBackendApiService: ReadOnlyCollectionBackendApiService,
    private statsReportingService: StatsReportingService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private userService: UserService,
    private currentEngineService: CurrentEngineService,
    private diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService,
    private windowDimensionsService: WindowDimensionsService,
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private checkpointProgressService: CheckpointProgressService,
    private conversationFlowService: ConversationFlowService,
    private chapterProgressService: ChapterProgressService
  ) {}

  ngOnInit(): void {
    this._editorPreviewMode =
      this.pageContextService.isInExplorationEditorPage();
    this.correctnessFooterIsShown =
      !this.pageContextService.isInDiagnosticTestPlayerPage();

    let collectionId = this.urlService.getCollectionIdFromExplorationUrl();
    this.pidInUrl = this.urlService.getPidFromUrl();

    if (collectionId) {
      this.readOnlyCollectionBackendApiService
        .loadCollectionAsync(collectionId)
        .then(collection => {
          this.collectionTitle = collection.getTitle();
        });
    } else {
      this.collectionTitle = null;
    }

    this.explorationId = this.pageContextService.getExplorationId();
    this.isIframed = this.urlService.isIframed();
    this.loaderService.showLoadingScreen('Loading');

    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );

    if (this.explorationModeService.isInQuestionPlayerMode()) {
      this.directiveSubscriptions.add(
        this.hintsAndSolutionManagerService.onHintConsumed.subscribe(() => {
          this.questionPlayerEngineService.recordHintUsed(
            this.questionPlayerEngineService.getCurrentQuestion()
          );
        })
      );

      this.directiveSubscriptions.add(
        this.hintsAndSolutionManagerService.onSolutionViewedEventEmitter.subscribe(
          () => {
            this.questionPlayerEngineService.recordSolutionViewed(
              this.questionPlayerEngineService.getCurrentQuestion()
            );
          }
        )
      );
    }

    this.directiveSubscriptions.add(
      this.conversationFlowService.onShowProgressModal.subscribe(() => {
        this.conversationFlowService.setHasFullyLoaded(true);
      })
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (newCard: StateCard) => {
          this.conversationFlowService.setSolutionForState(
            newCard.getSolution()
          );
          this.playerTranscriptService.resetNumberOfIncorrectSubmissions();
          this.conversationFlowService.setNextCardIfStuck(null);
          this.continueToReviseStateButtonIsVisible = false;
          this.conversationFlowService.triggerIfLearnerStuckAction(true, () => {
            this.continueToReviseStateButtonIsVisible = true;
          });
        }
      )
    );

    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onLearnerReallyStuck.subscribe(() => {
        this.conversationFlowService.triggerIfLearnerStuckAction(false, () => {
          this.continueToReviseStateButtonIsVisible = true;
        });
      })
    );

    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onHintsExhausted.subscribe(() => {
        this.conversationFlowService.triggerIfLearnerStuckAction(true, () => {
          this.continueToReviseStateButtonIsVisible = true;
        });
      })
    );

    this.directiveSubscriptions.add(
      this.conceptCardManagerService.onLearnerGetsReallyStuck.subscribe(() => {
        this.isLearnerReallyStuck = true;
        this.conversationFlowService.triggerIfLearnerStuckAction(false, () => {
          this.continueToReviseStateButtonIsVisible = true;
        });
      })
    );

    this.directiveSubscriptions.add(
      this.conversationFlowService.onPlayerStateChange.subscribe(
        newStateName => {
          if (!newStateName) {
            return;
          }
          // To restart the preloader for the new state if required.
          if (!this._editorPreviewMode) {
            this.imagePreloaderService.onStateChange(newStateName);
          }
          let nextCard = this.conversationFlowService.getNextStateCard();
          // Ensure the transition to a terminal state properly logs
          // the end of the exploration.
          if (!this._editorPreviewMode && nextCard.isTerminal()) {
            const currentEngineService =
              this.currentEngineService.getCurrentEngineService();
            const completedChaptersCount =
              this.chapterProgressService.getCompletedChaptersCount();
            this.statsReportingService.recordExplorationCompleted(
              newStateName,
              this.learnerParamsService.getAllParams(),
              String(completedChaptersCount && completedChaptersCount + 1),
              String(this.playerTranscriptService.getNumCards()),
              currentEngineService.getLanguageCode()
            );

            // For single state explorations, when the exploration
            // reaches the terminal state and explorationActuallyStarted
            // is false, record exploration actual start event.
            if (!this.conversationFlowService.getExplorationActuallyStarted()) {
              this.statsReportingService.recordExplorationActuallyStarted(
                newStateName
              );
              this.conversationFlowService.setExplorationActuallyStarted(true);
            }
          }
        }
      )
    );

    // Moved the following code to then section as isLoggedIn
    // variable needs to be defined before the following code is executed.
    this.userService.getUserInfoAsync().then(async userInfo => {
      this.isLoggedIn = userInfo.isLoggedIn();
      this.conversationFlowService.setIsLoggedIn(this.isLoggedIn);

      this.windowRef.nativeWindow.addEventListener('beforeunload', e => {
        let redirectToRefresherExplorationConfirmed =
          this.conversationFlowService.getRedirectToRefresherExplorationConfirmed();
        if (redirectToRefresherExplorationConfirmed) {
          return;
        }
        if (
          this.conversationFlowService.getHasInteractedAtLeastOnce() &&
          !this._editorPreviewMode &&
          !this.conversationFlowService.getDisplayedCard().isTerminal() &&
          !this.explorationModeService.isInQuestionMode()
        ) {
          this.statsReportingService.recordMaybeLeaveEvent(
            this.playerTranscriptService.getLastStateName(),
            this.learnerParamsService.getAllParams()
          );

          let confirmationMessage =
            'Please save your progress before navigating away from the' +
            ' page; else, you will lose your exploration progress.';
          (e || this.windowRef.nativeWindow.event).returnValue =
            confirmationMessage;
          return confirmationMessage;
        }
      });

      let pid =
        this.localStorageService.getUniqueProgressIdOfLoggedOutLearner();
      if (pid && this.isLoggedIn) {
        await this.editableExplorationBackendApiService.changeLoggedOutProgressToLoggedInProgressAsync(
          this.explorationId,
          pid
        );
        this.localStorageService.removeUniqueProgressIdOfLoggedOutLearner();
      }

      this.cardAnimationService.adjustPageHeightOnresize();

      this.currentInteractionService.setOnSubmitFn(
        this.conversationFlowService.submitAnswer.bind(
          this.conversationFlowService
        )
      );
      this.initializePage();

      this.collectionSummary = null;

      if (collectionId) {
        this.collectionPlayerBackendApiService
          .fetchCollectionSummariesAsync(collectionId)
          .then(response => {
            this.collectionSummary = response.summaries[0];
          })
          .catch(() => {
            this.alertsService.addWarning(
              'There was an error while fetching the collection summary.'
            );
          });
      }

      if (this.isLoggedIn) {
        this.chapterProgressService.updateCompletedChaptersCount();
      }

      // We do not save checkpoints progress for iframes.
      if (
        !this.isIframed &&
        !this._editorPreviewMode &&
        !this.explorationModeService.isInQuestionPlayerMode() &&
        !this.explorationModeService.isInDiagnosticTestPlayerMode()
      ) {
        // For the first state which is always a checkpoint.
        let firstStateName: string;
        let expVersion: number;
        this.readOnlyExplorationBackendApiService
          .loadLatestExplorationAsync(this.explorationId, this.pidInUrl)
          .then(response => {
            expVersion = response.version;
            firstStateName = response.exploration.init_state_name;
            let mostRecentlyReachedCheckpoint =
              response.most_recently_reached_checkpoint_state_name;

            // If the exploration is freshly started, mark the first state
            // as the most recently reached checkpoint.
            if (!mostRecentlyReachedCheckpoint) {
              mostRecentlyReachedCheckpoint = firstStateName;
              if (this.isLoggedIn) {
                this.editableExplorationBackendApiService.recordMostRecentlyReachedCheckpointAsync(
                  this.explorationId,
                  expVersion,
                  firstStateName,
                  true
                );
              }
            }
            this.checkpointProgressService.setMostRecentlyReachedCheckpoint(
              mostRecentlyReachedCheckpoint
            );
            this.checkpointProgressService.setVisitedCheckpointStateNames(
              firstStateName
            );
          });
      }
    });
  }

  isSubmitButtonDisabled(): boolean {
    let currentIndex = this.playerPositionService.getDisplayedCardIndex();
    // This check is added because it was observed that when returning
    // to current card after navigating through previous cards, using
    // the arrows, the Submit button was sometimes falsely disabled.
    // Also, since a learner's answers would always be in the current
    // card, this additional check doesn't interfere with its normal
    // working.
    if (!this.playerTranscriptService.isLastCard(currentIndex)) {
      return false;
    }
    return this.currentInteractionService.isSubmitButtonDisabled();
  }

  ngAfterViewChecked(): void {
    let submitButtonIsDisabled = this.isSubmitButtonDisabled();
    if (submitButtonIsDisabled !== this.submitButtonIsDisabled) {
      this.submitButtonIsDisabled = submitButtonIsDisabled;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  getAnswerIsBeingProcessed(): boolean {
    return this.conversationFlowService.getAnswerIsBeingProcessed();
  }

  getCanAskLearnerForAnswerInfo(): boolean {
    return this.learnerAnswerInfoService.getCanAskLearnerForAnswerInfo();
  }

  isCorrectnessFooterEnabled(): boolean {
    return (
      this.correctnessFooterIsShown &&
      this.conversationFlowService.getAnswerIsCorrect() &&
      this.playerPositionService.hasLearnerJustSubmittedAnAnswer()
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getExplorationLink(): string {
    return this.explorationRecommendationsService.getExplorationLink(
      this.conversationFlowService.getRecommendedExplorationSummaries()
    );
  }

  isOnTerminalCard(): boolean {
    let displayedCard = this.conversationFlowService.getDisplayedCard();
    return displayedCard && displayedCard.isTerminal();
  }

  isCurrentSupplementalCardNonempty(): boolean {
    let displayedCard = this.conversationFlowService.getDisplayedCard();
    return (
      displayedCard &&
      this.conversationFlowService.isSupplementalCardNonempty(displayedCard)
    );
  }

  getIsAnimatingToTwoCards(): boolean {
    return this.cardAnimationService.getIsAnimatingToTwoCards();
  }

  getIsAnimatingToOneCard(): boolean {
    return this.cardAnimationService.getIsAnimatingToOneCard();
  }

  isSupplementalNavShown(): boolean {
    let displayedCard = this.conversationFlowService.getDisplayedCard();
    if (
      displayedCard.getStateName() === null &&
      !this.explorationModeService.isInQuestionMode()
    ) {
      return false;
    }
    let interaction = displayedCard.getInteraction();
    return (
      Boolean(interaction.id) &&
      INTERACTION_SPECS[interaction.id].show_generic_submit_button &&
      this.isCurrentCardAtEndOfTranscript()
    );
  }

  isCurrentCardAtEndOfTranscript(): boolean {
    return this.playerPositionService.isCurrentCardAtEndOfTranscript();
  }

  triggerRedirectionToStuckState(): void {
    // Redirect the learner.
    this.conversationFlowService.setNextStateCard(
      this.conversationFlowService.getNextCardIfStuck()
    );
    this.showInteraction = false;
    this.conversationFlowService.showPendingCard();
  }

  showQuestionAreNotAvailable(): void {
    this.loaderService.hideLoadingScreen();
  }

  skipCurrentQuestion(): void {
    this.diagnosticTestPlayerEngineService.skipCurrentQuestion(nextCard => {
      this.conversationFlowService.setNextStateCard(nextCard);
      this.conversationFlowService.showPendingCard();
    });
  }

  isLearnAgainButton(): boolean {
    return this.conversationFlowService.isLearnAgainButton();
  }

  initializePage(): void {
    this.conversationFlowService.setRecommendedExplorationSummaries([]);
    this.playerPositionService.init(
      this.conversationFlowService.navigateToDisplayedCard.bind(
        this.conversationFlowService
      )
    );
    if (this.questionPlayerConfig) {
      this.explorationModeService.setQuestionPlayerMode();
      this.questionPlayerEngineService.initQuestionPlayer(
        this.questionPlayerConfig,
        this.conversationFlowService.initializeDirectiveComponents.bind(
          this.conversationFlowService
        ),
        this.showQuestionAreNotAvailable
      );
    } else if (this.diagnosticTestTopicTrackerModel) {
      this.explorationModeService.setDiagnosticTestPlayerMode();
      this.diagnosticTestPlayerEngineService.init(
        this.diagnosticTestTopicTrackerModel,
        this.conversationFlowService.initializeDirectiveComponents.bind(
          this.conversationFlowService
        )
      );
    } else {
      this.explorationInitializationService.initializePlayer(
        this.conversationFlowService.initializeDirectiveComponents.bind(
          this.conversationFlowService
        )
      );
    }
  }

  submitAnswerFromProgressNav(): void {
    this.conversationFlowService.getDisplayedCard().toggleSubmitClicked(true);
    this.currentInteractionService.submitAnswer();
  }

  getRecommendedExpTitleTranslationKey(explorationId: string): string {
    return this.i18nLanguageCodeService.getExplorationTranslationKey(
      explorationId,
      TranslationKeyType.TITLE
    );
  }

  isHackyExpTitleTranslationDisplayed(explorationId: string): boolean {
    let recommendedExpTitleTranslationKey =
      this.getRecommendedExpTitleTranslationKey(explorationId);
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        recommendedExpTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isDisplayedCardCompletedInPrevSession(): boolean {
    let prevSessionStatesProgress =
      this.playerTranscriptService.getPrevSessionStatesProgress();
    let displayedCard = this.conversationFlowService.getDisplayedCard();
    return (
      displayedCard.getInteraction() &&
      prevSessionStatesProgress.indexOf(displayedCard.getStateName()) !== -1
    );
  }

  isProgressClearanceMessageShown(): boolean {
    return this.conversationFlowService.getShowProgressClearanceMessage();
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
    );
  }

  getDisplayedCard(): StateCard {
    return this.conversationFlowService.getDisplayedCard();
  }

  getHasFullyLoaded(): boolean {
    return this.conversationFlowService.getHasFullyLoaded();
  }

  getRecommendationExplorationSummaries(): LearnerExplorationSummary[] {
    return this.conversationFlowService.getRecommendedExplorationSummaries();
  }

  getIsInStoryMode(): boolean {
    return this.explorationModeService.isInStoryChapterMode();
  }
}
