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
 * @fileoverview Utility service for the learner's view of an exploration.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AppConstants} from 'app.constants';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {
  Exploration,
  ExplorationBackendDict,
  ExplorationObjectFactory,
} from 'domain/exploration/ExplorationObjectFactory';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {ParamChange} from 'domain/exploration/ParamChangeObjectFactory';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {
  BindableVoiceovers,
  RecordedVoiceovers,
} from 'domain/exploration/recorded-voiceovers.model';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {StateObjectsBackendDict} from 'domain/exploration/StatesObjectFactory';
import {State} from 'domain/state/StateObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {TextInputCustomizationArgs} from 'interactions/customization-args-defs';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {ExplorationFeaturesBackendApiService} from 'services/exploration-features-backend-api.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from './answer-classification.service';
import {AudioPreloaderService} from './audio-preloader.service';
import {AudioTranslationLanguageService} from './audio-translation-language.service';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {ImagePreloaderService} from './image-preloader.service';
import {
  ExplorationParams,
  LearnerParamsService,
} from './learner-params.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {StatsReportingService} from './stats-reporting.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';

@Injectable({
  providedIn: 'root',
})
export class ExplorationEngineService {
  private _explorationId: string;
  private _editorPreviewMode: boolean;
  private _questionPlayerMode: boolean;
  private _updateActiveStateIfInEditorEventEmitter: EventEmitter<string> =
    new EventEmitter();

  answerIsBeingProcessed: boolean = false;
  alwaysAskLearnersForAnswerDetails: boolean = false;
  exploration: Exploration;

  // This list may contain duplicates. A state name is added to it each time
  // the learner moves to a new card.
  visitedStateNames: string[] = [];
  currentStateName: string;
  nextStateName: string;
  nextStateIfStuckName: string | null;

  // Param changes to be used ONLY in editor preview mode.
  manualParamChanges: ParamChange[];
  initStateName: string;
  version: number;

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioPreloaderService: AudioPreloaderService,
    private audioTranslationLanguageService: AudioTranslationLanguageService,
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contextService: ContextService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private entityTranslationsService: EntityTranslationsService,
    private explorationFeaturesBackendApiService: ExplorationFeaturesBackendApiService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private explorationObjectFactory: ExplorationObjectFactory,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private imagePreloaderService: ImagePreloaderService,
    private learnerParamsService: LearnerParamsService,
    private playerTranscriptService: PlayerTranscriptService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private statsReportingService: StatsReportingService,
    private translateService: TranslateService,
    private urlService: UrlService
  ) {
    this.setExplorationProperties();
  }

  setExplorationProperties(): void {
    let pathnameArray = this.urlService.getPathname().split('/');
    let explorationContext = false;

    for (let i = 0; i < pathnameArray.length; i++) {
      if (
        pathnameArray[i] === 'explore' ||
        pathnameArray[i] === 'create' ||
        pathnameArray[i] === 'skill_editor' ||
        pathnameArray[i] === 'embed' ||
        pathnameArray[i] === 'lesson'
      ) {
        explorationContext = true;
        break;
      }
    }

    if (explorationContext) {
      this._explorationId = this.contextService.getExplorationId();
      this.version = this.urlService.getExplorationVersionFromUrl();
      this._editorPreviewMode = this.contextService.isInExplorationEditorPage();
      this._questionPlayerMode = this.contextService.isInQuestionPlayerMode();
      if (
        !this._questionPlayerMode &&
        !(
          'skill_editor' ===
          this.urlService.getPathname().split('/')[1].replace(/"/g, "'")
        )
      ) {
        this.readOnlyExplorationBackendApiService
          .loadExplorationAsync(this._explorationId, this.version)
          .then(exploration => {
            this.version = exploration.version;
          });
      }
    } else {
      this._explorationId = 'test_id';
      this.version = 1;
      this._editorPreviewMode = false;
      this._questionPlayerMode = false;
    }
  }

  randomFromArray<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private _getFeedback(
    answer: string,
    oldStateCard: StateCard,
    outcome: Outcome,
    envs: Record<string, string>[]
  ): string {
    const oldInteractionId = oldStateCard.getInteractionId();
    const oldInteractionArgs =
      oldStateCard.getInteractionCustomizationArgs() as TextInputCustomizationArgs;
    const defaultOutcome = oldStateCard.getInteraction()?.defaultOutcome;
    const shouldCheckForMisspelling =
      oldInteractionId === AppConstants.INTERACTION_NAMES.TEXT_INPUT &&
      oldInteractionArgs.catchMisspellings &&
      angular.equals(outcome, defaultOutcome);

    if (shouldCheckForMisspelling) {
      const answerIsOnlyMisspelled =
        this.answerClassificationService.isAnswerOnlyMisspelled(
          oldStateCard.getInteraction(),
          answer
        );
      if (answerIsOnlyMisspelled) {
        const randomResponse = this.randomFromArray(
          ExplorationPlayerConstants.I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_IDS
        );
        return this.translateService.instant(randomResponse);
      }
    }

    return this.expressionInterpolationService.processHtml(
      outcome.feedback.html,
      envs
    );
  }

  private _getRandomSuffix(): string {
    // This is a bit of a hack. When a refresh to a $scope variable
    // happens,
    // AngularJS compares the new value of the variable to its previous
    // value. If they are the same, then the variable is not updated.
    // Appending a random suffix makes the new value different from the
    // previous one, and thus indirectly forces a refresh.
    let randomSuffix = '';
    let N = Math.round(Math.random() * 1000);
    for (let i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  // Evaluate parameters. Returns null if any evaluation fails.
  makeParams(
    oldParams: ExplorationParams,
    paramChanges: ParamChange[],
    envs: Record<string, string>[]
  ): ExplorationParams {
    let newParams: ExplorationParams = {...oldParams};
    if (
      paramChanges.every(pc => {
        if (pc.generatorId === 'Copier') {
          if (!pc.customizationArgs.parse_with_jinja) {
            newParams[pc.name] = pc.customizationArgs.value;
          } else {
            let paramValue: string =
              this.expressionInterpolationService.processUnicode(
                pc.customizationArgs.value,
                [newParams].concat(envs)
              );
            if (paramValue === null) {
              return false;
            }
            newParams[pc.name] = paramValue;
          }
        } else {
          // RandomSelector.
          newParams[pc.name] = this.randomFromArray(
            pc.customizationArgs.list_of_values
          );
        }
        return true;
      })
    ) {
      // All parameters were evaluated successfully.
      return newParams;
    }
    // Evaluation of some parameter failed.
    return null;
  }

  // Evaluate question string.
  makeQuestion(newState: State, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html,
      envs
    );
  }

  // This should only be called when 'exploration' is non-null.
  _loadInitialState(
    successCallback: (stateCard: StateCard, str: string) => void
  ): void {
    let initialState: State = this.exploration.getInitialState();
    let oldParams: ExplorationParams = this.learnerParamsService.getAllParams();
    let newParams: ExplorationParams = this.makeParams(
      oldParams,
      initialState.paramChanges,
      [oldParams]
    );
    if (newParams === null) {
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }
    if (newParams) {
      this.learnerParamsService.init(newParams);
    }
    this.currentStateName = this.exploration.initStateName;
    this.nextStateName = this.exploration.initStateName;

    let interaction: Interaction = this.exploration.getInteraction(
      this.exploration.initStateName
    );
    let nextFocusLabel: string = this.focusManagerService.generateFocusLabel();

    let interactionId = interaction.id;
    let interactionHtml = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        this.exploration.getInteractionCustomizationArgs(this.currentStateName),
        true,
        nextFocusLabel,
        null
      );
    }

    let questionHtml: string = this.makeQuestion(initialState, [newParams]);
    if (questionHtml === null) {
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }

    if (!this._editorPreviewMode) {
      this.statsReportingService.recordExplorationStarted(
        this.exploration.initStateName,
        newParams
      );
    }

    let initialCard = StateCard.createNewCard(
      this.currentStateName,
      questionHtml,
      interactionHtml,
      interaction,
      initialState.recordedVoiceovers,
      initialState.content.contentId,
      this.audioTranslationLanguageService
    );
    successCallback(initialCard, nextFocusLabel);
  }

  // Initialize the parameters in the exploration as specified in the
  // exploration-level initial parameter changes list, followed by any
  // manual parameter changes (in editor preview mode).
  initParams(manualParamChanges: ParamChange[]): void {
    let baseParams = {};
    this.exploration.paramSpecs.forEach((paramName, paramSpec) => {
      baseParams[paramName] = paramSpec.getType().createDefaultValue();
    });

    let startingParams = this.makeParams(
      baseParams,
      this.exploration.paramChanges.concat(manualParamChanges),
      [baseParams]
    );

    this.learnerParamsService.init(startingParams);
  }

  private _getInteractionHtmlByStateName(
    labelForFocusTarget: string,
    stateName: string
  ): string {
    let interactionId: string = this.exploration.getInteractionId(stateName);

    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      this.exploration.getInteractionCustomizationArgs(stateName),
      true,
      labelForFocusTarget,
      null
    );
  }

  checkAlwaysAskLearnersForAnswerDetails(): void {
    this.explorationFeaturesBackendApiService
      .fetchExplorationFeaturesAsync(this._explorationId)
      .then(featuresData => {
        this.alwaysAskLearnersForAnswerDetails =
          featuresData.alwaysAskLearnersForAnswerDetails;
      });
  }

  // This should only be used in editor preview mode. It sets the
  // exploration data from what's currently specified in the editor, and
  // also initializes the parameters to empty strings.
  initSettingsFromEditor(
    activeStateNameFromPreviewTab: string,
    manualParamChangesToInit: ParamChange[]
  ): void {
    if (this._editorPreviewMode) {
      this.manualParamChanges = manualParamChangesToInit;
      this.initStateName = activeStateNameFromPreviewTab;
    } else {
      throw new Error('Cannot populate exploration in learner mode.');
    }
  }

  /**
   * Initializes an exploration, passing the data for the first state to
   * successCallback.
   *
   * In editor preview mode, populateExploration() must be called before
   * calling init().
   *
   * @param {function} successCallback - The function to execute after the
   *   initial exploration data is successfully loaded. This function will
   *   be passed two arguments:
   *   - stateName {string}, the name of the first state
   *   - initHtml {string}, an HTML string representing the content of the
   *       first state.
   */
  init(
    explorationDict: ExplorationBackendDict,
    explorationVersion: number,
    preferredAudioLanguage: string | null,
    autoTtsEnabled: boolean,
    preferredContentLanguageCodes: string[],
    displayableLanguageCodes: string[],
    successCallback: (stateCard: StateCard, label: string) => void
  ): void {
    this.exploration =
      this.explorationObjectFactory.createFromBackendDict(explorationDict);
    this.answerIsBeingProcessed = false;
    if (this._editorPreviewMode) {
      this.exploration.setInitialStateName(this.initStateName);
      this.visitedStateNames = [this.exploration.getInitialState().name];
      this.initParams(this.manualParamChanges);
      this.audioTranslationLanguageService.init(
        this.exploration.getAllVoiceoverLanguageCodes(),
        null,
        this.exploration.getLanguageCode(),
        explorationDict.auto_tts_enabled
      );
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(this.initStateName);
      this._loadInitialState(successCallback);
    } else {
      this.visitedStateNames.push(this.exploration.getInitialState().name);
      this.version = explorationVersion;
      this.initParams([]);
      this.audioTranslationLanguageService.init(
        this.exploration.getAllVoiceoverLanguageCodes(),
        preferredAudioLanguage,
        this.exploration.getLanguageCode(),
        autoTtsEnabled
      );
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(
        this.exploration.getInitialState().name
      );
      this.imagePreloaderService.init(this.exploration);
      this.imagePreloaderService.kickOffImagePreloader(
        this.exploration.getInitialState().name
      );
      this.checkAlwaysAskLearnersForAnswerDetails();
      this._loadInitialState(successCallback);
    }

    this.entityTranslationsService.init(
      this._explorationId,
      'exploration',
      this.version
    );
    this.contentTranslationManagerService.setOriginalTranscript(
      this.exploration.getLanguageCode()
    );

    this.contentTranslationLanguageService.init(
      displayableLanguageCodes,
      preferredContentLanguageCodes,
      this.exploration.getLanguageCode()
    );
  }

  moveToExploration(successCallback: (StateCard, string) => void): void {
    this._loadInitialState(successCallback);
  }

  isCurrentStateInitial(): boolean {
    return this.currentStateName === this.exploration.initStateName;
  }

  recordNewCardAdded(): void {
    this.currentStateName = this.nextStateName;
  }

  getState(): State {
    let stateName: string = this.playerTranscriptService.getLastStateName();
    return this.exploration.getState(stateName);
  }

  getStateFromStateName(stateName: string): State {
    return this.exploration.getState(stateName);
  }

  getExplorationId(): string {
    return this._explorationId;
  }

  getExplorationTitle(): string {
    return this.exploration.title;
  }

  getExplorationVersion(): number {
    return this.version;
  }

  getAuthorRecommendedExpIdsByStateName(stateName: string): string[] {
    return this.exploration.getAuthorRecommendedExpIds(stateName);
  }

  getLanguageCode(): string {
    return this.exploration.getLanguageCode();
  }

  isInPreviewMode(): boolean {
    return !!this._editorPreviewMode;
  }

  submitAnswer(
    answer: string,
    interactionRulesService: InteractionRulesService,
    successCallback: (
      nextCard: StateCard,
      refreshInteraction: boolean,
      feedbackHtml: string,
      feedbackAudioTranslations: BindableVoiceovers,
      refresherExplorationId: string,
      missingPrerequisiteSkillId: string,
      remainOnCurrentCard: boolean,
      taggedSkillMisconceptionId: string,
      wasOldStateInitial: boolean,
      isFirstHit: boolean,
      isFinalQuestion: boolean,
      nextCardIfReallyStuck: StateCard | null,
      focusLabel: string
    ) => void
  ): boolean {
    if (this.answerIsBeingProcessed) {
      return;
    }
    this.answerIsBeingProcessed = true;
    let oldStateName: string = this.playerTranscriptService.getLastStateName();
    let oldState: State = this.exploration.getState(oldStateName);
    let recordedVoiceovers: RecordedVoiceovers = oldState.recordedVoiceovers;
    let oldStateCard: StateCard = this.playerTranscriptService.getLastCard();
    let classificationResult: AnswerClassificationResult =
      this.answerClassificationService.getMatchingClassificationResult(
        oldStateName,
        oldStateCard.getInteraction(),
        answer,
        interactionRulesService
      );
    let answerIsCorrect: boolean =
      classificationResult.outcome.labelledAsCorrect;

    // Use {...} to clone the object
    // since classificationResult.outcome points
    // at oldState.interaction.default_outcome.
    let outcome = {...classificationResult.outcome};
    let newStateName: string = outcome.dest;

    if (!this._editorPreviewMode) {
      let feedbackIsUseful: boolean =
        this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          oldStateName,
          oldState,
          answer,
          interactionRulesService
        );
      this.statsReportingService.recordAnswerSubmitted(
        oldStateName,
        this.learnerParamsService.getAllParams(),
        answer,
        this._explorationId,
        answerIsCorrect,
        classificationResult.answerGroupIndex,
        classificationResult.ruleIndex,
        classificationResult.classificationCategorization,
        feedbackIsUseful
      );

      this.statsReportingService.recordAnswerSubmitAction(
        oldStateName,
        newStateName,
        oldState.interaction.id,
        answer,
        outcome.feedback.html
      );
    }

    let refresherExplorationId = outcome.refresherExplorationId;
    let missingPrerequisiteSkillId = outcome.missingPrerequisiteSkillId;
    let newState = this.exploration.getState(newStateName);
    let isFirstHit = Boolean(
      this.visitedStateNames.indexOf(newStateName) === -1
    );
    if (oldStateName !== newStateName) {
      this.visitedStateNames.push(newStateName);
    }
    // Compute the data for the next state.
    let oldParams: ExplorationParams = this.learnerParamsService.getAllParams();
    oldParams.answer = answer;
    let feedbackHtml: string = this._getFeedback(
      answer,
      oldStateCard,
      classificationResult.outcome,
      [oldParams]
    );
    let feedbackContentId: string = outcome.feedback.contentId;
    let feedbackAudioTranslations: BindableVoiceovers =
      recordedVoiceovers.getBindableVoiceovers(feedbackContentId);
    if (feedbackHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Feedback content should not be empty.');
      return;
    }
    let newParams = newState
      ? this.makeParams(oldParams, newState.paramChanges, [oldParams])
      : oldParams;
    if (newParams === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Parameters should not be empty.');
      return;
    }

    let questionHtml = this.makeQuestion(newState, [
      newParams,
      {
        answer: 'answer',
      },
    ]);
    if (questionHtml === null) {
      this.answerIsBeingProcessed = false;
      // TODO(#13133): Remove all question related naming conventions.
      this.alertsService.addWarning('Question content should not be empty.');
      return;
    }

    // TODO(sll): Remove the 'answer' key from newParams.
    newParams.answer = answer;

    this.answerIsBeingProcessed = false;

    let refreshInteraction =
      oldStateName !== newStateName ||
      this.exploration.isInteractionInline(oldStateName);
    this.nextStateName = newStateName;
    let onSameCard: boolean = oldStateName === newStateName;

    this._updateActiveStateIfInEditorEventEmitter.emit(newStateName);

    let _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextInteractionHtml = null;
    if (this.exploration.getInteraction(this.nextStateName).id) {
      nextInteractionHtml = this._getInteractionHtmlByStateName(
        _nextFocusLabel,
        this.nextStateName
      );
    }

    if (newParams) {
      this.learnerParamsService.init(newParams);
    }

    questionHtml = questionHtml + this._getRandomSuffix();
    nextInteractionHtml = nextInteractionHtml + this._getRandomSuffix();

    let nextCard = StateCard.createNewCard(
      this.nextStateName,
      questionHtml,
      nextInteractionHtml,
      this.exploration.getInteraction(this.nextStateName),
      this.exploration.getState(this.nextStateName).recordedVoiceovers,
      this.exploration.getState(this.nextStateName).content.contentId,
      this.audioTranslationLanguageService
    );

    const nextCardIfReallyStuck = this._getNextCardIfReallyStuck(
      answer,
      outcome.destIfReallyStuck,
      oldParams,
      _nextFocusLabel
    );
    successCallback(
      nextCard,
      refreshInteraction,
      feedbackHtml,
      feedbackAudioTranslations,
      refresherExplorationId,
      missingPrerequisiteSkillId,
      onSameCard,
      null,
      oldStateName === this.exploration.initStateName,
      isFirstHit,
      false,
      nextCardIfReallyStuck,
      _nextFocusLabel
    );
    return answerIsCorrect;
  }

  private _getNextCardIfReallyStuck(
    answer: string,
    newStateNameIfStuck: string | null,
    oldParams: ExplorationParams,
    nextFocusLabel: string
  ): StateCard | null {
    if (newStateNameIfStuck === null) {
      return null;
    }
    let newStateIfStuck = this.exploration.getState(newStateNameIfStuck);
    let newParamsIfStuck = newStateIfStuck
      ? this.makeParams(oldParams, newStateIfStuck.paramChanges, [oldParams])
      : oldParams;

    let questionHtmlIfStuck = this.makeQuestion(newStateIfStuck, [
      newParamsIfStuck,
      {
        answer: 'answer',
      },
    ]);

    newParamsIfStuck.answer = answer;

    this.nextStateIfStuckName = newStateNameIfStuck;

    let nextInteractionIfStuckHtml = null;
    if (this.exploration.getInteraction(this.nextStateIfStuckName).id) {
      nextInteractionIfStuckHtml = this._getInteractionHtmlByStateName(
        nextFocusLabel,
        this.nextStateIfStuckName
      );
    }

    questionHtmlIfStuck = questionHtmlIfStuck + this._getRandomSuffix();
    nextInteractionIfStuckHtml =
      nextInteractionIfStuckHtml + this._getRandomSuffix();

    return StateCard.createNewCard(
      this.nextStateIfStuckName,
      questionHtmlIfStuck,
      nextInteractionIfStuckHtml,
      this.exploration.getInteraction(this.nextStateIfStuckName),
      this.exploration.getState(this.nextStateIfStuckName).recordedVoiceovers,
      this.exploration.getState(this.nextStateIfStuckName).content.contentId,
      this.audioTranslationLanguageService
    );
  }

  isAnswerBeingProcessed(): boolean {
    return this.answerIsBeingProcessed;
  }

  getAlwaysAskLearnerForAnswerDetails(): boolean {
    return this.alwaysAskLearnersForAnswerDetails;
  }

  get onUpdateActiveStateIfInEditor(): EventEmitter<string> {
    return this._updateActiveStateIfInEditorEventEmitter;
  }

  getStateCardByName(stateName: string): StateCard {
    const _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let interactionHtml = null;
    if (this.exploration.getInteraction(stateName).id) {
      interactionHtml = this._getInteractionHtmlByStateName(
        _nextFocusLabel,
        stateName
      );
    }
    let contentHtml =
      this.exploration.getState(stateName).content.html +
      this._getRandomSuffix();
    interactionHtml = interactionHtml + this._getRandomSuffix();

    return StateCard.createNewCard(
      stateName,
      contentHtml,
      interactionHtml,
      this.exploration.getInteraction(stateName),
      this.exploration.getState(stateName).recordedVoiceovers,
      this.exploration.getState(stateName).content.contentId,
      this.audioTranslationLanguageService
    );
  }

  getShortestPathToState(
    allStates: StateObjectsBackendDict,
    destStateName: string
  ): string[] {
    let stateGraphLinks: {source: string; target: string}[] = [];

    // Create a list of all possible links between states.
    for (let stateName of Object.keys(allStates)) {
      let interaction = this.exploration.getState(stateName).interaction;
      if (interaction.id) {
        let groups = interaction.answerGroups;
        for (let h = 0; h < groups.length; h++) {
          stateGraphLinks.push({
            source: stateName,
            target: groups[h].outcome.dest,
          });
        }

        if (interaction.defaultOutcome) {
          stateGraphLinks.push({
            source: stateName,
            target: interaction.defaultOutcome.dest,
          });
        }
      }
    }

    let shortestPathToStateInReverse: string[] = [];
    let pathsQueue: string[] = [];
    let visitedNodes: Record<string, boolean> = {};
    let nodeToParentMap: Record<string, string> = {};
    visitedNodes[this.exploration.initStateName] = true;
    pathsQueue.push(this.exploration.initStateName);
    // 1st state does not have a parent
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    nodeToParentMap[this.exploration.initStateName] = null;
    while (pathsQueue.length > 0) {
      // '.shift()' here can return an undefined value, but we're already
      // checking for pathsQueue.length > 0, so this is safe.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let currStateName = pathsQueue.shift()!;

      if (currStateName === destStateName) {
        break;
      }

      for (let e = 0; e < stateGraphLinks.length; e++) {
        let edge = stateGraphLinks[e];
        let dest = edge.target;
        if (
          edge.source === currStateName &&
          !visitedNodes.hasOwnProperty(dest)
        ) {
          visitedNodes[dest] = true;
          nodeToParentMap[dest] = currStateName;
          pathsQueue.push(dest);
        }
      }
    }

    // Reconstruct the shortest path from node to parent map.
    let currStateName = destStateName;
    while (currStateName !== null) {
      shortestPathToStateInReverse.push(currStateName);
      currStateName = nodeToParentMap[currStateName];
    }
    // Actual shortest path in order is reverse of the path retrieved
    // from parent map, hence we return the reversed path that goes
    // from initStateName to destStateName.
    return shortestPathToStateInReverse.reverse();
  }
}
