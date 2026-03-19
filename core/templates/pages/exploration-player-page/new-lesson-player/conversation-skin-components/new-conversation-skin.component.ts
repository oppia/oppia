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
 * @fileoverview Component for the new conversation skin.
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
import {StatsReportingService} from '../../services/stats-reporting.service';
import {UrlService} from 'services/contextual/url.service';
import {UserService} from 'services/user.service';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ExplorationInitializationService} from '../../services/exploration-initialization.service';
import {NewLessonPlayerConstants} from '../../new-lesson-player/lesson-player-page.constants';
import {CollectionPlayerBackendApiService} from 'pages/collection-player-page/services/collection-player-backend-api.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ConversationFlowService} from '../../services/conversation-flow.service';
import {CheckpointProgressService} from '../../services/checkpoint-progress.service';
import './new-conversation-skin.component.css';
import {ConceptCardManagerService} from '../../services/concept-card-manager.service';
import {DiagnosticTestPlayerEngineService} from 'pages/exploration-player-page/services/diagnostic-test-player-engine.service';
import {ExplorationModeService} from 'pages/exploration-player-page/services/exploration-mode.service';
import {ChapterProgressService} from 'pages/exploration-player-page/services/chapter-progress.service';
import {CurrentEngineService} from 'pages/exploration-player-page/services/current-engine.service';
import {CardAnimationService} from 'pages/exploration-player-page/services/card-animation.service';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {DiagnosticTestTopicTrackerModel} from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {MobileMenuService} from 'pages/exploration-player-page/services/mobile-menu.service';

@Component({
  selector: 'oppia-new-conversation-skin',
  templateUrl: './new-conversation-skin.component.html',
  styleUrls: ['./new-conversation-skin.component.css'],
})
export class NewConversationSkinComponent {
  // This throws "Type 'QuestionPlayerConfig' is not assignable to type 'QuestionPlayerConfigDict'".
  // We need to suppress this error because we are inputting it as type of QuestionPlayerConfig
  // and passing it to a parameter of QuestionPlayerConfigDict, so it throws a type error.
  // That's why we have to keep it ignored until we finalize the correct type.
  // TODO(#10474): Reconcile the types QuestionPlayerConfig and QuestionPlayerConfigDict
  // to remove the need for @ts-ignore and ensure type safety.
  // @ts-ignore
  @Input() questionPlayerConfig;
  @Input() diagnosticTestTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  directiveSubscriptions = new Subscription();

  _editorPreviewMode!: boolean;

  isLoggedIn!: boolean;
  voiceoversAreLoaded: boolean = false;
  explorationId!: string;
  isIframed!: boolean;
  OPPIA_AVATAR_IMAGE_URL!: string;
  correctnessFooterIsShown: boolean = true;
  collectionSummary: string | null = null;
  pidInUrl!: string | null;
  submitButtonIsDisabled = true;
  isLearnerReallyStuck: boolean = false;
  showInteraction: boolean = true;
  checkpointCelebrationIsShown: boolean = false;
  viewIsInitialized: boolean = false;

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
    private explorationEngineService: ExplorationEngineService,
    private learnerAnswerInfoService: LearnerAnswerInfoService,
    private learnerParamsService: LearnerParamsService,
    private loaderService: LoaderService,
    private localStorageService: LocalStorageService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
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
    private chapterProgressService: ChapterProgressService,
    private mobileMenuService: MobileMenuService
  ) {}

  ngOnInit(): void {
    this._editorPreviewMode =
      this.pageContextService.isInExplorationEditorPage();
    this.correctnessFooterIsShown =
      !this.pageContextService.isInDiagnosticTestPlayerPage();

    let collectionId = this.urlService.getCollectionIdFromExplorationUrl();
    this.pidInUrl = this.urlService.getPidFromUrl();

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
          let pathnameArray = this.urlService.getPathname().split('/');

          if (
            pathnameArray.includes('lesson') &&
            !pathnameArray.includes('embed')
          ) {
            const stateData =
              this.explorationEngineService.getStateFromStateName(
                newCard.getStateName()
              );

            if (stateData.cardIsCheckpoint) {
              this.checkpointCelebrationIsShown = true;
              setTimeout(() => {
                this.checkpointCelebrationIsShown = false;
              }, 5000);
            }
          }

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
        // This throws "Argument of type '(answer: string, interactionRulesService: InteractionRulesService) => void'
        // is not assignable to parameter of type 'OnSubmitFn'. Types of parameters 'answer' and 'answer' are incompatible.
        // Type 'InteractionAnswer' is not assignable to type 'string'."
        // We need to suppress this error because the submitAnswer function currently expects a string,
        // but the OnSubmitFn type allows for multiple types (e.g., number, boolean, object).
        // This is safe in this context because the interaction associated with this component only returns string answers.
        // TODO(#10474): Refactor submitAnswer to handle all InteractionAnswer types for full type safety.
        // @ts-ignore
        this.conversationFlowService.submitAnswer.bind(
          this.conversationFlowService
        )
      );

      this.initializePage();

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

  getSidebarIsExpanded(): boolean {
    return this.mobileMenuService.getSidebarIsExpanded();
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

  isSupplementalNavShown(): boolean {
    let displayedCard = this.conversationFlowService.getDisplayedCard();
    if (
      displayedCard.getStateName() === null &&
      !this.explorationModeService.isInQuestionMode()
    ) {
      return false;
    }

    let interaction = displayedCard.getInteraction();
    if (!interaction || !interaction.id) {
      return false;
    }

    const interactionId = interaction.id;

    if (
      typeof interactionId === 'string' &&
      interactionId in INTERACTION_SPECS
    ) {
      return (
        INTERACTION_SPECS[interactionId as keyof typeof INTERACTION_SPECS]
          .show_generic_submit_button && this.isCurrentCardAtEndOfTranscript()
      );
    }

    return false;
  }

  isCurrentCardAtEndOfTranscript(): boolean {
    return this.playerPositionService.isCurrentCardAtEndOfTranscript();
  }

  triggerRedirectionToStuckState(): void {
    // Redirect the learner.
    let nextStateCard = this.conversationFlowService.getNextCardIfStuck();
    if (nextStateCard) {
      this.conversationFlowService.setNextStateCard(nextStateCard);
    }
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

  isCheckpointCelebrationFooterEnabled(): boolean {
    if (!this.pageContextService.isInExplorationPlayerPage()) {
      return false;
    }
    const prevSessionStatesProgress =
      this.playerTranscriptService.getPrevSessionStatesProgress();
    const firstStateName = this.playerTranscriptService.getCard(0);

    const displayedCard = this.conversationFlowService.getDisplayedCard();
    const displayCardIndex = this.playerPositionService.getDisplayedCardIndex();
    const numOfCards = this.playerTranscriptService.getNumCards();
    let getPreviousCard, getPreviousCardName;
    if (numOfCards >= displayCardIndex && displayCardIndex > 0) {
      getPreviousCard = this.playerTranscriptService.getCard(
        displayCardIndex - 1
      );
      getPreviousCardName = getPreviousCard.getStateName();
    }
    const stateData = this.explorationEngineService.getStateFromStateName(
      displayedCard.getStateName()
    );

    return (
      !prevSessionStatesProgress.includes(getPreviousCardName as string) &&
      this.checkpointCelebrationIsShown &&
      displayedCard.getStateName() !== firstStateName.getStateName() &&
      stateData.cardIsCheckpoint
    );
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return (
      this.windowDimensionsService.getWidth() >
      NewLessonPlayerConstants.TWO_CARD_THRESHOLD_PX
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

  isInLessonPlayer(): boolean {
    const pathnameArray = this.urlService.getPathname().split('/');
    if (pathnameArray[1] === 'lesson') {
      return true;
    }
    return false;
  }
}
