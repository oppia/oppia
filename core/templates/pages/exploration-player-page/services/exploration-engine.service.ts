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
 * @fileoverview Utility service for the learner's view of an exploration.
 */

import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import cloneDeep from 'lodash/cloneDeep';
import { AnswerClassificationService, InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { ContentTranslationLanguageService } from 'pages/exploration-player-page/services/content-translation-language.service';
import { Exploration, ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateCard, StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AudioPreloaderService } from 'pages/exploration-player-page/services/audio-preloader.service';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { LearnerParamsService, ExplorationParams } from 'pages/exploration-player-page/services/learner-params.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { StatsReportingService } from 'pages/exploration-player-page/services/stats-reporting.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ExplorationFeaturesBackendApiService } from 'services/exploration-features-backend-api.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { UrlService } from 'services/contextual/url.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { State } from 'domain/state/StateObjectFactory';
import { ParamChange } from 'domain/exploration/ParamChangeObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { BindableVoiceovers } from 'domain/exploration/recorded-voiceovers.model';

// A service that provides a number of utility functions for JS used by
// the player skin.
// Note that this service is used both in the learner and the editor views.
// The URL determines which of these it is. Some methods may need to be
// implemented differently depending on whether the skin is being played
// in the learner view, or whether it is being previewed in the editor view.

@Injectable({
  providedIn: 'root'
})
export class ExplorationEngineService {
  exploration: Exploration;
  currentStateName: string;
  nextStateName: string;
  _editorPreviewMode: boolean;
  _explorationId: string;
  alwaysAskLearnersForAnswerDetails: boolean;
  manualParamChanges: ParamChange[];
  initStateName: string;
  answerIsBeingProcessed: boolean;
  visitedStateNames: string[];
  version: number;
  _questionPlayerMode: boolean;
  _updateActiveStateIfInEditorEventEmitter = new EventEmitter();

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
    private urlService: UrlService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private learnerParamsService: LearnerParamsService,
    private statsReportingService: StatsReportingService,
    private stateCardObjectFactory: StateCardObjectFactory,
    private playerTranscriptService: PlayerTranscriptService
  ) {
    this._explorationId = this.contextService.getExplorationId();
    this._editorPreviewMode = this.contextService.isInExplorationEditorPage();
    this._questionPlayerMode = this.contextService.isInQuestionPlayerMode();
    this.answerIsBeingProcessed = false;
    this.alwaysAskLearnersForAnswerDetails = false;

    this.exploration = null;

    // This list may contain duplicates. A state name is added to it each time
    // the learner moves to a new card.
    this.visitedStateNames = [];
    this.currentStateName = null;
    this.nextStateName = null;

    // Param changes to be used ONLY in editor preview mode.
    this.manualParamChanges = null;
    this.initStateName = null;
    this.version = this.urlService.getExplorationVersionFromUrl();
    if (!this._questionPlayerMode &&
      !('skill_editor' === urlService.getPathname()
        .split('/')[1].replace(/"/g, "'"))) {
      this.readOnlyExplorationBackendApiService
        .loadExploration(this._explorationId, this.version)
        .then((exploration) => {
          this.version = exploration.version;
        });
    }
  }

  private randomFromArray(
      arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Evaluate feedback.
  private makeFeedback(
      feedbackHtml: string,
      envs: Record<string, string>[]): string {
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
  private makeParams(
      oldParams: ExplorationParams,
      paramChanges: ParamChange[],
      envs: ExplorationParams[]): ExplorationParams {
    let newParams: ExplorationParams = cloneDeep(oldParams);
    if (paramChanges.every(pc => {
      if (pc.generatorId === 'Copier') {
        if ('parse_with_jinja' in pc.customizationArgs) {
          if (!pc.customizationArgs.parse_with_jinja) {
            newParams[pc.name] = pc.customizationArgs.value;
          } else {
            if ('value' in pc.customizationArgs) {
              let paramValue =
                this.expressionInterpolationService.processUnicode(
                  pc.customizationArgs.value, [newParams].concat(envs));
              if (paramValue === null) {
                return false;
              }
              newParams[pc.name] = paramValue;
            }
          }
        }
      } else {
        // RandomSelector.
        if ('list_of_values' in pc.customizationArgs && 'name' in pc) {
          newParams[pc.name] = this.randomFromArray(
            pc.customizationArgs.list_of_values);
        }
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
  private makeQuestion(
      newState: State,
      envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html, envs);
  }

  // This should only be called when 'exploration' is non-null.
  private _loadInitialState(
      successCallback: (StateCard, string) => void): void {
    let initialState: State = this.exploration.getInitialState();
    let oldParams: ExplorationParams = this.learnerParamsService.getAllParams();
    let newParams: ExplorationParams = this.makeParams(
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
    let nextFocusLabel = this.focusManagerService.generateFocusLabel();

    let interactionId = interaction.id;
    let interactionHtml = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        this.exploration.getInteractionCustomizationArgs(this.nextStateName),
        true, nextFocusLabel, null);
    }

    let questionHtml = this.makeQuestion(initialState, [newParams]);
    if (questionHtml === null) {
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }

    if (!this._editorPreviewMode) {
      this.statsReportingService.recordExplorationStarted(
        this.exploration.initStateName, newParams);
    }

    let initialCard =
      this.stateCardObjectFactory.createNewCard(
        this.currentStateName, questionHtml, interactionHtml,
        interaction, initialState.recordedVoiceovers,
        initialState.writtenTranslations,
        initialState.content.contentId);
    successCallback(initialCard, nextFocusLabel);
  }

  // Initialize the parameters in the exploration as specified in the
  // exploration-level initial parameter changes list, followed by any
  // manual parameter changes (in editor preview mode).
  private initParams(manualParamChanges: ParamChange[]): void {
    let baseParams = {};
    this.exploration.paramSpecs.forEach(function(paramName, paramSpec) {
      baseParams[paramName] = paramSpec.getType().createDefaultValue();
    });

    var startingParams = this.makeParams(
      baseParams,
      this.exploration.paramChanges.concat(manualParamChanges),
      [baseParams]);

    this.learnerParamsService.init(startingParams);
  }

  private _getNextInteractionHtml(labelForFocusTarget: string): string {
    let interactionId = this.exploration.getInteractionId(this.nextStateName);

    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      this.exploration.getInteractionCustomizationArgs(this.nextStateName),
      true,
      labelForFocusTarget, null);
  }

  private checkAlwaysAskLearnersForAnswerDetails(): void {
    this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
      this._explorationId).then((featuresData) => {
      this.alwaysAskLearnersForAnswerDetails = (
        featuresData.alwaysAskLearnersForAnswerDetails);
    });
  }

  // This should only be used in editor preview mode. It sets the
  // exploration data from what's currently specified in the editor, and
  // also initializes the parameters to empty strings.
  initSettingsFromEditor(
      activeStateNameFromPreviewTab: string,
      manualParamChangesToInit: ParamChange[]): void {
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
      preferredAudioLanguage: string,
      autoTtsEnabled: boolean,
      preferredContentLanguageCodes: string[],
      successCallback: (StateCard, string) => void): void {
    this.exploration = this.explorationObjectFactory.createFromBackendDict(
      explorationDict);
    this.answerIsBeingProcessed = false;
    if (this._editorPreviewMode) {
      this.exploration.setInitialStateName(this.initStateName);
      this.visitedStateNames = [this.exploration.getInitialState().name];
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
      this.visitedStateNames.push(this.exploration.getInitialState().name);
      this.version = explorationVersion;
      this.initParams([]);
      this.audioTranslationLanguageService.init(
        this.exploration.getAllVoiceoverLanguageCodes(),
        preferredAudioLanguage,
        this.exploration.getLanguageCode(),
        autoTtsEnabled);
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(
        this.exploration.getInitialState().name);
      this.imagePreloaderService.init(this.exploration);
      this.imagePreloaderService.kickOffImagePreloader(
        this.exploration.getInitialState().name);
      this.checkAlwaysAskLearnersForAnswerDetails();
      this._loadInitialState(successCallback);
    }
    this.contentTranslationLanguageService.init(
      this.exploration.getDisplayableWrittenTranslationLanguageCodes(),
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
    let stateName = this.playerTranscriptService.getLastStateName();
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

  getAuthorRecommendedExpIds(): string[] {
    return this.exploration.getAuthorRecommendedExpIds(this.currentStateName);
  }

  getLanguageCode(): string {
    return this.exploration.getLanguageCode();
  }

  isInPreviewMode(): boolean {
    return !this._editorPreviewMode;
  }

  submitAnswer(
      answer: string,
      interactionRulesService: InteractionRulesService,
      successCallback: (
        nextCard: StateCard,
        refreshInteraction: boolean,
        feedbackHtml: string,
        feedbackAudioTranslations: BindableVoiceovers,
        refresherExplorationId,
        missingPrerequisiteSkillId,
        remainOnCurrentCard: boolean,
        taggedSkillMisconceptionId: string,
        wasOldStateInitial,
        isFirstHit,
        isFinalQuestion: boolean,
        focusLabel: string) => void): boolean {
    if (this.answerIsBeingProcessed) {
      return;
    }
    this.answerIsBeingProcessed = true;
    let oldStateName = this.playerTranscriptService.getLastStateName();
    let oldState = this.exploration.getState(oldStateName);
    let recordedVoiceovers = oldState.recordedVoiceovers;
    let oldStateCard = this.playerTranscriptService.getLastCard();
    let classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        oldStateName, oldStateCard.getInteraction(), answer,
        interactionRulesService));
    let answerIsCorrect = classificationResult.outcome.labelledAsCorrect;

    // Use angular.copy() to clone the object
    // since classificationResult.outcome points
    // at oldState.interaction.default_outcome.
    let outcome: Outcome = cloneDeep(classificationResult.outcome);
    let newStateName = outcome.dest;

    if (!this._editorPreviewMode) {
      let feedbackIsUseful = (
        this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          oldStateName, oldState, answer,
          interactionRulesService));
      this.statsReportingService.recordAnswerSubmitted(
        oldStateName,
        this.learnerParamsService.getAllParams(),
        answer,
        classificationResult.answerGroupIndex,
        classificationResult.ruleIndex,
        classificationResult.classificationCategorization,
        feedbackIsUseful);

      this.statsReportingService.recordAnswerSubmitAction(
        oldStateName, newStateName, oldState.interaction.id, answer,
        outcome.feedback.html);
    }

    let refresherExplorationId = outcome.refresherExplorationId;
    let missingPrerequisiteSkillId = outcome.missingPrerequisiteSkillId;
    let newState = this.exploration.getState(newStateName);
    let isFirstHit = Boolean(this.visitedStateNames.indexOf(
      newStateName) === -1);
    if (oldStateName !== newStateName) {
      this.visitedStateNames.push(newStateName);
    }
    // Compute the data for the next state.
    let oldParams = this.learnerParamsService.getAllParams();
    oldParams.answer = answer;
    let feedbackHtml =
      this.makeFeedback(outcome.feedback.html, [oldParams]);
    let feedbackContentId = outcome.feedback.contentId;
    let feedbackAudioTranslations: BindableVoiceovers = (
      recordedVoiceovers.getBindableVoiceovers(feedbackContentId));
    if (feedbackHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }
    let newParams = (
      newState ? this.makeParams(
        oldParams, newState.paramChanges, [oldParams]) : oldParams);
    if (newParams === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }

    let questionHtml = this.makeQuestion(newState, [newParams, {
      answer: 'answer'
    }]);
    if (questionHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }

    // TODO(sll): Remove the 'answer' key from newParams.
    newParams.answer = answer;

    this.answerIsBeingProcessed = false;

    let refreshInteraction = (
      oldStateName !== newStateName ||
      this.exploration.isInteractionInline(oldStateName));
    this.nextStateName = newStateName;
    let onSameCard = (oldStateName === newStateName);

    this._updateActiveStateIfInEditorEventEmitter.emit(newStateName);

    let _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextInteractionHtml = null;
    if (this.exploration.getInteraction(this.nextStateName).id) {
      nextInteractionHtml = this._getNextInteractionHtml(_nextFocusLabel);
    }
    if (newParams) {
      this.learnerParamsService.init(newParams);
    }

    questionHtml = questionHtml + this._getRandomSuffix();
    nextInteractionHtml = nextInteractionHtml + this._getRandomSuffix();

    let nextCard = this.stateCardObjectFactory.createNewCard(
      this.nextStateName, questionHtml, nextInteractionHtml,
      this.exploration.getInteraction(this.nextStateName),
      this.exploration.getState(this.nextStateName).recordedVoiceovers,
      this.exploration.getState(this.nextStateName).writtenTranslations,
      this.exploration.getState(this.nextStateName).content.contentId);
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

  get onUpdateActiveStateIfInEditor(): EventEmitter<void> {
    return this._updateActiveStateIfInEditorEventEmitter;
  }
}

angular.module('oppia').factory(
  'ExplorationEngineService',
  downgradeInjectable(ExplorationEngineService));
