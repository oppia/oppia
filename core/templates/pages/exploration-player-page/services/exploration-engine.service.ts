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

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { Exploration, ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { ParamChange } from 'domain/exploration/ParamChangeObjectFactory';
import { ParamSpec } from 'domain/exploration/ParamSpecObjectFactory';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { BindableVoiceovers, RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationFeaturesBackendApiService } from 'services/exploration-features-backend-api.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AnswerClassificationService, InteractionRulesService } from './answer-classification.service';
import { AudioPreloaderService } from './audio-preloader.service';
import { AudioTranslationLanguageService } from './audio-translation-language.service';
import { ContentTranslationLanguageService } from './content-translation-language.service';
import { ImagePreloaderService } from './image-preloader.service';
import { ExplorationParams, LearnerParamsService } from './learner-params.service';
import { PlayerTranscriptService } from './player-transcript.service';
import { StatsReportingService } from './stats-reporting.service';

 @Injectable({
   providedIn: 'root'
 })
export class ExplorationEngineService {
  private _explorationId!: string;
  private _editorPreviewMode!: boolean;
  private _questionPlayerMode!: boolean;
  private _updateActiveStateIfInEditorEventEmitter: EventEmitter<string> = (
    new EventEmitter()
  );

  answerIsBeingProcessed: boolean = false;
  alwaysAskLearnersForAnswerDetails: boolean = false;
  exploration!: Exploration;

  // This list may contain duplicates. A state name is added to it each time
  // the learner moves to a new card.
  visitedStateNames: string[] = [];
  currentStateName!: string;
  nextStateName!: string;

  // Param changes to be used ONLY in editor preview mode.
  manualParamChanges!: ParamChange[];
  initStateName!: string;
  version!: number | null;

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioPreloaderService: AudioPreloaderService,
    private audioTranslationLanguageService: AudioTranslationLanguageService,
    private contentTranslationLanguageService:
      ContentTranslationLanguageService,
    private contextService: ContextService,
    private explorationFeaturesBackendApiService:
      ExplorationFeaturesBackendApiService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private explorationObjectFactory: ExplorationObjectFactory,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private imagePreloaderService: ImagePreloaderService,
    private learnerParamsService: LearnerParamsService,
    private playerTranscriptService: PlayerTranscriptService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private statsReportingService: StatsReportingService,
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
        pathnameArray[i] === 'embed'
      ) {
        explorationContext = true;
        break;
      }
    }

    if (explorationContext) {
      this._explorationId = this.contextService.getExplorationId();
      const version = this.urlService.getExplorationVersionFromUrl();
      if (version === null) {
        throw new Error('Invalid version.');
      } else {
        this.version = version;
      }
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
          .then((exploration) => {
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

  randomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Evaluate feedback.
  makeFeedback(
      feedbackHtml: string, envs: Record<string, string>[]
  ): string {
    return this.expressionInterpolationService.processHtml(feedbackHtml, envs);
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
  ): ExplorationParams | null {
    let newParams: ExplorationParams = { ...oldParams };
    if (paramChanges.every((pc) => {
      if (pc.generatorId === 'Copier') {
        const customizationArgsValue = pc.customizationArgs.value;
        if (customizationArgsValue === undefined) {
          return false;
        }
        if (!pc.customizationArgs.parse_with_jinja) {
          newParams[pc.name] = customizationArgsValue;
        } else {
          // Value is null if there is some error in the expression or syntax.
          let paramValue: string | null = (
            this.expressionInterpolationService.processUnicode(
              customizationArgsValue, [newParams].concat(envs)));
          if (paramValue === null) {
            return false;
          }
          newParams[pc.name] = paramValue;
        }
      } else {
        const customizationArgsListOfValues = (
          pc.customizationArgs.list_of_values);
        if (customizationArgsListOfValues === undefined) {
          return false;
        }
        // RandomSelector.
        newParams[pc.name] = this.randomFromArray(
          customizationArgsListOfValues);
      }
      return true;
    })) {
      // All parameters were evaluated successfully.
      return newParams;
    }
    // Evaluation of some parameter failed.
    return null;
  }

  // Evaluate question string.
  makeQuestion(newState: State, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html, envs);
  }

  // This should only be called when 'exploration' is non-null.
  _loadInitialState(
      successCallback: (stateCard: StateCard, str: string) => void
  ): void {
    let initialState: State = this.exploration.getInitialState();
    let oldParams: ExplorationParams = this.learnerParamsService.getAllParams();
    // Returns null if any evaluation fails.
    let newParams: ExplorationParams | null = this.makeParams(
      oldParams, initialState.paramChanges, [oldParams]);
    if (newParams === null) {
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }
    if (newParams) {
      this.learnerParamsService.init(newParams);
    }
    this.currentStateName = this.exploration.initStateName;
    this.nextStateName = this.exploration.initStateName;

    let interaction = this.exploration.getInteraction(
      this.exploration.initStateName);
    if (interaction === null) {
      throw new Error('Interaction not found.');
    }
    let nextFocusLabel: string = this.focusManagerService.generateFocusLabel();

    let interactionId = interaction.id;
    let interactionHtml = null;
    let interactionCustomizationArgs = (
      this.exploration.getInteractionCustomizationArgs(
        this.exploration.initStateName));
    if (interactionCustomizationArgs === null) {
      throw new Error('Interaction customization args not found.');
    }
    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        interactionCustomizationArgs,
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
        this.exploration.initStateName, newParams);
    }

    if (interactionHtml === null) {
      throw new Error('Interaction HTML not found.');
    }

    let contentId = initialState.content.contentId;
    if (contentId === null) {
      throw new Error('Content id not found.');
    }

    let initialCard = StateCard.createNewCard(
      this.currentStateName, questionHtml, interactionHtml,
      interaction, initialState.recordedVoiceovers,
      initialState.writtenTranslations, contentId,
      this.audioTranslationLanguageService);
    successCallback(initialCard, nextFocusLabel);
  }

  // Initialize the parameters in the exploration as specified in the
  // exploration-level initial parameter changes list, followed by any
  // manual parameter changes (in editor preview mode).
  initParams(manualParamChanges: ParamChange[]): void {
    let baseParams: ExplorationParams = {};
    this.exploration.paramSpecs.forEach((
        paramName: string, paramSpec: ParamSpec
    ) => {
      baseParams[paramName] = (
        paramSpec.getType().createDefaultValue() as string);
    });

    let startingParams = this.makeParams(
      baseParams,
      this.exploration.paramChanges.concat(manualParamChanges),
      [baseParams]);

    if (startingParams === null) {
      throw new Error('Expression parsing error.');
    }

    this.learnerParamsService.init(startingParams);
  }

  private _getInteractionHtmlByStateName(
      labelForFocusTarget: string, stateName: string
  ): string {
    let interactionId: string | null = this.exploration.getInteractionId(
      stateName);

    if (interactionId === null) {
      throw new Error('Interaction ID not found.');
    }

    let interactionCustomizationArgs = (
      this.exploration.getInteractionCustomizationArgs(stateName));
    if (interactionCustomizationArgs === null) {
      throw new Error('Interaction customization args not found.');
    }

    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      interactionCustomizationArgs,
      true,
      labelForFocusTarget, null);
  }

  checkAlwaysAskLearnersForAnswerDetails(): void {
    this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
      this._explorationId
    ).then((featuresData) => {
      this.alwaysAskLearnersForAnswerDetails = (
        featuresData.alwaysAskLearnersForAnswerDetails);
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
      explorationVersion: number | null,
      preferredAudioLanguage: string | null,
      autoTtsEnabled: boolean,
      preferredContentLanguageCodes: string[],
      successCallback: (stateCard: StateCard, label: string) => void
  ): void {
    this.exploration = this.explorationObjectFactory.createFromBackendDict(
      explorationDict);
    this.answerIsBeingProcessed = false;
    let stateName = this.exploration.getInitialState().name;
    if (stateName === null) {
      throw new Error('State name not found.');
    }
    if (this._editorPreviewMode) {
      this.exploration.setInitialStateName(this.initStateName);
      this.visitedStateNames = [stateName];
      this.initParams(this.manualParamChanges);
      this.audioTranslationLanguageService.init(
        this.exploration.getAllVoiceoverLanguageCodes(),
        null,
        this.exploration.getLanguageCode(),
        explorationDict.auto_tts_enabled);
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(this.initStateName);
      this._loadInitialState(successCallback);
    } else {
      this.visitedStateNames.push(stateName);
      this.version = explorationVersion;
      this.initParams([]);
      this.audioTranslationLanguageService.init(
        this.exploration.getAllVoiceoverLanguageCodes(),
        preferredAudioLanguage,
        this.exploration.getLanguageCode(),
        autoTtsEnabled);
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(stateName);
      this.imagePreloaderService.init(this.exploration);
      this.imagePreloaderService.kickOffImagePreloader(stateName);
      this.checkAlwaysAskLearnersForAnswerDetails();
      this._loadInitialState(successCallback);
    }
    this.contentTranslationLanguageService.init(
      this.exploration.getDisplayableWrittenTranslationLanguageCodes(),
      preferredContentLanguageCodes,
      this.exploration.getLanguageCode()
    );
  }

  moveToExploration(successCallback: (
    stateCard: StateCard, str: string) => void): void {
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

  getExplorationVersion(): number | null {
    return this.version;
  }

  // If no customization arguments are defined for a terminal state,
  // a null value is returned.
  getAuthorRecommendedExpIdsByStateName(stateName: string): string[] | null {
    return this.exploration.getAuthorRecommendedExpIds(stateName);
  }

  getLanguageCode(): string {
    return this.exploration.getLanguageCode();
  }

  isInPreviewMode(): boolean {
    return !!this._editorPreviewMode;
  }

  submitAnswer(
      answer: string, interactionRulesService: InteractionRulesService,
      successCallback: (
        nextCard: StateCard,
        refreshInteraction: boolean,
        feedbackHtml: string,
        feedbackAudioTranslations: BindableVoiceovers,
        // Below property is null if no refresher exploration is available for
        // the current state.
        refresherExplorationId: string | null,
        // Below property is null if no missing prerequisite skill is available
        // for the current state.
        missingPrerequisiteSkillId: string | null,
        remainOnCurrentCard: boolean,
        // Below property is null if no skill misconception is tagged to the
        // current state.
        taggedSkillMisconceptionId: string | null,
        wasOldStateInitial: boolean,
        isFirstHit: boolean,
        isFinalQuestion: boolean,
        focusLabel: string
      ) => void
  ): boolean {
    if (this.answerIsBeingProcessed) {
      return false;
    }
    this.answerIsBeingProcessed = true;
    let oldStateName: string = this.playerTranscriptService.getLastStateName();
    let oldState: State = this.exploration.getState(oldStateName);
    let recordedVoiceovers: RecordedVoiceovers = oldState.recordedVoiceovers;
    let oldStateCard: StateCard = this.playerTranscriptService.getLastCard();
    let classificationResult: AnswerClassificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        oldStateName, oldStateCard.getInteraction(), answer,
        interactionRulesService));
    let answerIsCorrect: boolean = (
      classificationResult.outcome.labelledAsCorrect);

    // Use {...} to clone the object
    // since classificationResult.outcome points
    // at oldState.interaction.default_outcome.
    let outcome = {...classificationResult.outcome};
    let newStateName: string = outcome.dest;

    if (!this._editorPreviewMode) {
      let feedbackIsUseful: boolean = (
        this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          oldStateName, oldState, answer, interactionRulesService));

      let ruleIndex = classificationResult.ruleIndex;
      if (ruleIndex === null) {
        throw new Error('Rule index should not be null.');
      }
      this.statsReportingService.recordAnswerSubmitted(
        oldStateName,
        this.learnerParamsService.getAllParams(),
        answer,
        classificationResult.answerGroupIndex,
        ruleIndex,
        classificationResult.classificationCategorization,
        feedbackIsUseful);

      let interactionId = oldState.interaction.id;
      if (interactionId === null) {
        throw new Error('Interaction ID should not be null.');
      }
      this.statsReportingService.recordAnswerSubmitAction(
        oldStateName, newStateName, interactionId, answer,
        outcome.feedback.html);
    }

    let refresherExplorationId = outcome.refresherExplorationId;
    let missingPrerequisiteSkillId = outcome.missingPrerequisiteSkillId;
    let newState = this.exploration.getState(newStateName);
    let isFirstHit = Boolean(
      this.visitedStateNames.indexOf(newStateName) === -1);
    if (oldStateName !== newStateName) {
      this.visitedStateNames.push(newStateName);
    }
    // Compute the data for the next state.
    let oldParams: ExplorationParams = this.learnerParamsService.getAllParams();
    oldParams.answer = answer;
    let feedbackHtml: string = this.makeFeedback(
      outcome.feedback.html, [oldParams]);
    let feedbackContentId: string | null = outcome.feedback.contentId;
    if (feedbackContentId === null) {
      throw new Error('Feedback content id should not be null.');
    }
    let feedbackAudioTranslations: BindableVoiceovers = (
      recordedVoiceovers.getBindableVoiceovers(feedbackContentId));
    if (feedbackHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Feedback content should not be empty.');
      return false;
    }
    let newParams = (
      newState ? this.makeParams(
        oldParams, newState.paramChanges, [oldParams]) : oldParams);
    if (newParams === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Parameters should not be empty.');
      return false;
    }

    let questionHtml = this.makeQuestion(newState, [newParams, {
      answer: 'answer'
    }]);
    if (questionHtml === null) {
      this.answerIsBeingProcessed = false;
      // TODO(#13133): Remove all question related naming conventions.
      this.alertsService.addWarning('Question content should not be empty.');
      return false;
    }

    // TODO(sll): Remove the 'answer' key from newParams.
    newParams.answer = answer;

    this.answerIsBeingProcessed = false;

    let refreshInteraction = (
      oldStateName !== newStateName ||
      this.exploration.isInteractionInline(oldStateName)
    );
    this.nextStateName = newStateName;
    let onSameCard: boolean = (oldStateName === newStateName);

    this._updateActiveStateIfInEditorEventEmitter.emit(newStateName);

    let _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextInteractionHtml = null;
    let interaction = this.exploration.getInteraction(newStateName);
    if (interaction && interaction.id) {
      nextInteractionHtml = (
        this._getInteractionHtmlByStateName(_nextFocusLabel, this.nextStateName)
      );
    }
    if (newParams) {
      this.learnerParamsService.init(newParams);
    }

    questionHtml = questionHtml + this._getRandomSuffix();
    nextInteractionHtml = nextInteractionHtml + this._getRandomSuffix();

    let nextStateName = this.exploration.getInteraction(newStateName);
    if (nextStateName === null) {
      throw new Error('Next state name is null.');
    }

    let contentId = (
      this.exploration.getState(this.nextStateName).content.contentId);
    if (contentId === null) {
      throw new Error('Content id should not be null.');
    }

    let nextCard = StateCard.createNewCard(
      this.nextStateName, questionHtml, nextInteractionHtml, nextStateName,
      this.exploration.getState(this.nextStateName).recordedVoiceovers,
      this.exploration.getState(this.nextStateName).writtenTranslations,
      contentId, this.audioTranslationLanguageService);
    successCallback(
      nextCard, refreshInteraction, feedbackHtml,
      feedbackAudioTranslations, refresherExplorationId,
      missingPrerequisiteSkillId, onSameCard, null,
      (oldStateName === this.exploration.initStateName), isFirstHit, false,
      _nextFocusLabel);
    return answerIsCorrect;
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
    let interactionStateName = this.exploration.getInteraction(stateName);
    if (interactionStateName === null) {
      throw new Error('Interaction state name is null.');
    }
    if (interactionStateName && interactionStateName.id) {
      interactionHtml = (
        this._getInteractionHtmlByStateName(
          _nextFocusLabel, stateName
        )
      );
    }
    let contentHtml = (
      this.exploration.getState(stateName).content.html +
      this._getRandomSuffix()
    );
    interactionHtml = interactionHtml + this._getRandomSuffix();

    let contentId = (
      this.exploration.getState(this.nextStateName).content.contentId);
    if (contentId === null) {
      throw new Error('Content id should not be null.');
    }

    return StateCard.createNewCard(
      stateName, contentHtml, interactionHtml, interactionStateName,
      this.exploration.getState(stateName).recordedVoiceovers,
      this.exploration.getState(stateName).writtenTranslations,
      contentId, this.audioTranslationLanguageService);
  }

  getShortestPathToState(
      allStates: StateObjectsBackendDict, destStateName: string | null
  ): string[] {
    let stateGraphLinks: { source: string; target: string }[] = [];

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
    let nodeToParentMap: Record<string, string | null> = {};
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
        if (edge.source === currStateName &&
          !visitedNodes.hasOwnProperty(dest)) {
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

angular.module('oppia').factory('ExplorationEngineService',
  downgradeInjectable(ExplorationEngineService));
