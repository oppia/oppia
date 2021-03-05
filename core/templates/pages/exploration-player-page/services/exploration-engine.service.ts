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

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Exploration, ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { ParamChange } from 'domain/exploration/ParamChangeObjectFactory';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { State } from 'domain/state/StateObjectFactory';
import { StateCard, StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
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
  private _explorationId: string;
  private _editorPreviewMode: boolean;
  private _questionPlayerMode: boolean;
  private _updateActiveStateIfInEditorEventEmitter: EventEmitter<string> =
  (new EventEmitter());

  answerIsBeingProcessed: boolean = false;
  alwaysAskLearnersForAnswerDetails: boolean = false;
  exploration: Exploration;

  // This list may contain duplicates. A state name is added to it each time
  // the learner moves to a new card.
  visitedStateNames: string[] = [];
  currentStateName: string;
  nextStateName: string;

  // Param changes to be used ONLY in editor preview mode.
  manualParamChanges: ParamChange[];
  initStateName: string;
  version: number;

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
    private stateCardObjectFactory: StateCardObjectFactory,
    private statsReportingService: StatsReportingService,
    private urlService: UrlService
  ) {
    this._explorationId = this.contextService.getExplorationId();
    this.version = this.urlService.getExplorationVersionFromUrl();
    this._editorPreviewMode = this.contextService.isInExplorationContext();
    this._questionPlayerMode = this.contextService.isInQuestionPlayerMode();

    if (!this._questionPlayerMode &&
      !('skill_editor' === this.urlService.getPathname()
        .split('/')[1].replace(/"/g, "'"))) {
      this.readOnlyExplorationBackendApiService
        .loadExploration(this._explorationId, this.version)
        .then((exploration) => {
          this.version = exploration.version;
        });
    }
  }

  randomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Evaluate feedback.
  makeFeedback(
      feedbackHtml: string, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService
      .processHtml(feedbackHtml, envs);
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
      oldParams: ExplorationParams, paramChanges: ParamChange[],
      envs: Record<string, string>[])
  : ExplorationParams {
    let newParams = angular.copy(oldParams);
    if (paramChanges.every((pc) => {
      if (pc.generatorId === 'Copier') {
        if (!pc.customizationArgs.parse_with_jinja) {
          newParams[pc.name] = pc.customizationArgs.value;
        } else {
          let paramValue = this.expressionInterpolationService.processUnicode(
            pc.customizationArgs.value, [newParams].concat(envs));
          if (paramValue === null) {
            return false;
          }
          newParams[pc.name] = paramValue;
        }
      } else {
        // RandomSelector.
        newParams[pc.name] = this.randomFromArray(
          pc.customizationArgs.list_of_values);
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
      successCallback: (stateCard: StateCard, str: string) => void): void {
    let initialState = this.exploration.getInitialState();
    let oldParams = this.learnerParamsService.getAllParams();
    let newParams = this.makeParams(
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

    let interaction = this.exploration
      .getInteraction(this.exploration.initStateName);
    let nextFocusLabel = this.focusManagerService.generateFocusLabel();

    let interactionId = interaction.id;
    let interactionHtml = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        this.exploration.getInteractionCustomizationArgs(this.currentStateName),
        true, nextFocusLabel);
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
  initParams(manualParamChanges: ParamChange[]): void {
    let baseParams = {};
    this.exploration.paramSpecs.forEach((paramName, paramSpec) => {
      baseParams[paramName] = paramSpec.getType().createDefaultValue();
    });

    let startingParams = this.makeParams(
      baseParams,
      this.exploration.paramChanges.concat(manualParamChanges),
      [baseParams]);

    this.learnerParamsService.init(startingParams);
  }


  private _getNextInteractionHtml(labelForFocusTarget): string {
    let interactionId = this.exploration.getInteractionId(this.nextStateName);

    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      this.exploration.getInteractionCustomizationArgs(this.nextStateName),
      true,
      labelForFocusTarget);
  }

  checkAlwaysAskLearnersForAnswerDetails(): void {
    this.explorationFeaturesBackendApiService.fetchExplorationFeatures(
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
      explorationVersion: number, preferredAudioLanguage: string,
      autoTtsEnabled: boolean, preferredContentLanguageCodes: string[],
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
    var stateName = this.playerTranscriptService.getLastStateName();
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
    return !!this._editorPreviewMode;
  }

  SubmitAnswer(
      answer: string, interactionRulesService: InteractionRulesService,
      successCallback): boolean {
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
    let outcome = angular.copy(classificationResult.outcome);
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
        outcome.feedback);
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
    let feedbackAudioTranslations = (
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

  get onUpdateActiveStateIfInEditor(): EventEmitter<string> {
    return this._updateActiveStateIfInEditorEventEmitter;
  }
}

angular.module('oppia').factory('ExplorationEngineService',
  downgradeInjectable(ExplorationEngineService));

// import { EventEmitter } from '@angular/core';

// require('domain/collection/guest-collection-progress.service.ts');
// require('domain/exploration/editable-exploration-backend-api.service.ts');
// require('domain/exploration/ExplorationObjectFactory.ts');
// require('domain/exploration/read-only-exploration-backend-api.service.ts');
// require('domain/state_card/StateCardObjectFactory.ts');
// require('domain/utilities/language-util.service.ts');
// require('domain/utilities/url-interpolation.service.ts');
// require('expressions/expression-interpolation.service.ts');
// require(
//   'pages/exploration-player-page/services/answer-classification.service.ts');
// require('pages/exploration-player-page/services/audio-preloader.service.ts');
// require(
//   'pages/exploration-player-page/services/' +
//   'audio-translation-language.service.ts');
// require('pages/exploration-player-page/services/image-preloader.service.ts');
// require('pages/exploration-player-page/services/learner-params.service.ts');
// require('pages/exploration-player-page/services/number-attempts.service.ts');
// require('pages/exploration-player-page/services/player-transcript.service.ts');
// require(
//   'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
// require('pages/exploration-player-page/services/stats-reporting.service.ts');
// require('services/alerts.service.ts');
// require('services/context.service.ts');
// require('services/exploration-features-backend-api.service.ts');
// require('services/exploration-html-formatter.service.ts');
// require('services/user.service.ts');
// require('services/contextual/url.service.ts');
// require('services/contextual/window-dimensions.service.ts');
// require('services/stateful/focus-manager.service.ts');

// require('pages/interaction-specs.constants.ajs.ts');

// // A service that provides a number of utility functions for JS used by
// // the player skin.
// // Note that this service is used both in the learner and the editor views.
// // The URL determines which of these it is. Some methods may need to be
// // implemented differently depending on whether the skin is being played
// // in the learner view, or whether it is being previewed in the editor view.
// angular.module('oppia').factory('ExplorationEngineService', [
//   '$rootScope', 'AlertsService', 'AnswerClassificationService',
//   'AudioPreloaderService', 'AudioTranslationLanguageService',
//   'ContentTranslationLanguageService', 'ContextService',
//   'ExplorationFeaturesBackendApiService', 'ExplorationHtmlFormatterService',
//   'ExplorationObjectFactory', 'ExpressionInterpolationService',
//   'FocusManagerService', 'ImagePreloaderService', 'LearnerParamsService',
//   'PlayerTranscriptService', 'ReadOnlyExplorationBackendApiService',
//   'StateCardObjectFactory', 'StatsReportingService', 'UrlService',
//   function(
//       $rootScope, AlertsService, AnswerClassificationService,
//       AudioPreloaderService, AudioTranslationLanguageService,
//       ContentTranslationLanguageService, ContextService,
//       ExplorationFeaturesBackendApiService, ExplorationHtmlFormatterService,
//       ExplorationObjectFactory, ExpressionInterpolationService,
//       FocusManagerService, ImagePreloaderService, LearnerParamsService,
//       PlayerTranscriptService, ReadOnlyExplorationBackendApiService,
//       StateCardObjectFactory, StatsReportingService, UrlService) {
//     var _explorationId = ContextService.getExplorationId();
//     var _editorPreviewMode = ContextService.isInExplorationEditorPage();
//     var _questionPlayerMode = ContextService.isInQuestionPlayerMode();
//     var answerIsBeingProcessed = false;
//     var alwaysAskLearnersForAnswerDetails = false;

//     var exploration = null;

//     var _updateActiveStateIfInEditorEventEmitter = new EventEmitter();

//     // This list may contain duplicates. A state name is added to it each time
//     // the learner moves to a new card.
//     var visitedStateNames = [];
//     var currentStateName = null;
//     var nextStateName = null;

//     // Param changes to be used ONLY in editor preview mode.
//     var manualParamChanges = null;
//     var initStateName = null;
//     var version = UrlService.getExplorationVersionFromUrl();
//     if (!_questionPlayerMode && !('skill_editor' === UrlService.getPathname()
//       .split('/')[1].replace(/"/g, "'"))) {
//       ReadOnlyExplorationBackendApiService
//         .loadExploration(_explorationId, version)
//         .then(function(exploration) {
//           version = exploration.version;
//           $rootScope.$applyAsync();
//         });
//     }

//     var randomFromArray = function(arr) {
//       return arr[Math.floor(Math.random() * arr.length)];
//     };

//     // Evaluate feedback.
//     var makeFeedback = function(feedbackHtml, envs) {
//       return ExpressionInterpolationService.processHtml(feedbackHtml, envs);
//     };

//     var _getRandomSuffix = function() {
//       // This is a bit of a hack. When a refresh to a $scope variable
//       // happens,
//       // AngularJS compares the new value of the variable to its previous
//       // value. If they are the same, then the variable is not updated.
//       // Appending a random suffix makes the new value different from the
//       // previous one, and thus indirectly forces a refresh.
//       var randomSuffix = '';
//       var N = Math.round(Math.random() * 1000);
//       for (var i = 0; i < N; i++) {
//         randomSuffix += ' ';
//       }
//       return randomSuffix;
//     };

//     // Evaluate parameters. Returns null if any evaluation fails.
//     var makeParams = function(oldParams, paramChanges, envs) {
//       var newParams = angular.copy(oldParams);
//       if (paramChanges.every(function(pc) {
//         if (pc.generatorId === 'Copier') {
//           if (!pc.customizationArgs.parse_with_jinja) {
//             newParams[pc.name] = pc.customizationArgs.value;
//           } else {
//             var paramValue = ExpressionInterpolationService.processUnicode(
//               pc.customizationArgs.value, [newParams].concat(envs));
//             if (paramValue === null) {
//               return false;
//             }
//             newParams[pc.name] = paramValue;
//           }
//         } else {
//           // RandomSelector.
//           newParams[pc.name] = randomFromArray(
//             pc.customizationArgs.list_of_values);
//         }
//         return true;
//       })) {
//         // All parameters were evaluated successfully.
//         return newParams;
//       }
//       // Evaluation of some parameter failed.
//       return null;
//     };

//     // Evaluate question string.
//     var makeQuestion = function(newState, envs) {
//       return ExpressionInterpolationService.processHtml(
//         newState.content.html, envs);
//     };

//     // This should only be called when 'exploration' is non-null.
//     var _loadInitialState = function(successCallback) {
//       var initialState = exploration.getInitialState();
//       var oldParams = LearnerParamsService.getAllParams();
//       var newParams = makeParams(
//         oldParams, initialState.paramChanges, [oldParams]);
//       if (newParams === null) {
//         AlertsService.addWarning('Expression parsing error.');
//         return;
//       }
//       if (newParams) {
//         LearnerParamsService.init(newParams);
//       }
//       currentStateName = exploration.initStateName;
//       nextStateName = exploration.initStateName;

//       var interaction = exploration.getInteraction(exploration.initStateName);
//       var nextFocusLabel = FocusManagerService.generateFocusLabel();

//       var interactionId = interaction.id;
//       var interactionHtml = null;

//       if (interactionId) {
//         interactionHtml = ExplorationHtmlFormatterService.getInteractionHtml(
//           interactionId,
//           exploration.getInteractionCustomizationArgs(currentStateName),
//           true, nextFocusLabel);
//       }

//       var questionHtml = makeQuestion(initialState, [newParams]);
//       if (questionHtml === null) {
//         AlertsService.addWarning('Expression parsing error.');
//         return;
//       }

//       if (!_editorPreviewMode) {
//         StatsReportingService.recordExplorationStarted(
//           exploration.initStateName, newParams);
//       }

//       var initialCard =
//         StateCardObjectFactory.createNewCard(
//           currentStateName, questionHtml, interactionHtml,
//           interaction, initialState.recordedVoiceovers,
//           initialState.writtenTranslations,
//           initialState.content.contentId);
//       successCallback(initialCard, nextFocusLabel);
//     };

//     // Initialize the parameters in the exploration as specified in the
//     // exploration-level initial parameter changes list, followed by any
//     // manual parameter changes (in editor preview mode).
//     var initParams = function(manualParamChanges) {
//       var baseParams = {};
//       exploration.paramSpecs.forEach(function(paramName, paramSpec) {
//         baseParams[paramName] = paramSpec.getType().createDefaultValue();
//       });

//       var startingParams = makeParams(
//         baseParams,
//         exploration.paramChanges.concat(manualParamChanges),
//         [baseParams]);

//       LearnerParamsService.init(startingParams);
//     };

//     var _getNextInteractionHtml = function(labelForFocusTarget) {
//       var interactionId = exploration.getInteractionId(nextStateName);

//       return ExplorationHtmlFormatterService.getInteractionHtml(
//         interactionId,
//         exploration.getInteractionCustomizationArgs(nextStateName),
//         true,
//         labelForFocusTarget);
//     };

//     var checkAlwaysAskLearnersForAnswerDetails = function() {
//       ExplorationFeaturesBackendApiService.fetchExplorationFeatures(
//         _explorationId).then(function(featuresData) {
//         alwaysAskLearnersForAnswerDetails = (
//           featuresData.alwaysAskLearnersForAnswerDetails);
//       });
//     };

//     return {
//       // This should only be used in editor preview mode. It sets the
//       // exploration data from what's currently specified in the editor, and
//       // also initializes the parameters to empty strings.
//       initSettingsFromEditor: function(
//           activeStateNameFromPreviewTab, manualParamChangesToInit) {
//         if (_editorPreviewMode) {
//           manualParamChanges = manualParamChangesToInit;
//           initStateName = activeStateNameFromPreviewTab;
//         } else {
//           throw new Error('Cannot populate exploration in learner mode.');
//         }
//       },
//       /**
//        * Initializes an exploration, passing the data for the first state to
//        * successCallback.
//        *
//        * In editor preview mode, populateExploration() must be called before
//        * calling init().
//        *
//        * @param {function} successCallback - The function to execute after the
//        *   initial exploration data is successfully loaded. This function will
//        *   be passed two arguments:
//        *   - stateName {string}, the name of the first state
//        *   - initHtml {string}, an HTML string representing the content of the
//        *       first state.
//        */
//       init: function(
//           explorationDict, explorationVersion, preferredAudioLanguage,
//           autoTtsEnabled, preferredContentLanguageCodes,
//           successCallback) {
//         exploration = ExplorationObjectFactory.createFromBackendDict(
//           explorationDict);
//         answerIsBeingProcessed = false;
//         if (_editorPreviewMode) {
//           exploration.setInitialStateName(initStateName);
//           visitedStateNames = [exploration.getInitialState().name];
//           initParams(manualParamChanges);
//           AudioTranslationLanguageService.init(
//             exploration.getAllVoiceoverLanguageCodes(),
//             null,
//             exploration.getLanguageCode(),
//             explorationDict.auto_tts_enabled);
//           AudioPreloaderService.init(exploration);
//           AudioPreloaderService.kickOffAudioPreloader(initStateName);
//           _loadInitialState(successCallback);
//         } else {
//           visitedStateNames.push(exploration.getInitialState().name);
//           version = explorationVersion;
//           initParams([]);
//           AudioTranslationLanguageService.init(
//             exploration.getAllVoiceoverLanguageCodes(),
//             preferredAudioLanguage,
//             exploration.getLanguageCode(),
//             autoTtsEnabled);
//           AudioPreloaderService.init(exploration);
//           AudioPreloaderService.kickOffAudioPreloader(
//             exploration.getInitialState().name);
//           ImagePreloaderService.init(exploration);
//           ImagePreloaderService.kickOffImagePreloader(
//             exploration.getInitialState().name);
//           checkAlwaysAskLearnersForAnswerDetails();
//           _loadInitialState(successCallback);
//         }
//         ContentTranslationLanguageService.init(
//           exploration.getDisplayableWrittenTranslationLanguageCodes(),
//           preferredContentLanguageCodes,
//           exploration.getLanguageCode()
//         );
//       },
//       moveToExploration: function(successCallback) {
//         _loadInitialState(successCallback);
//       },
//       isCurrentStateInitial: function() {
//         return currentStateName === exploration.initStateName;
//       },
//       recordNewCardAdded: function() {
//         currentStateName = nextStateName;
//       },
//       getState: function() {
//         var stateName = PlayerTranscriptService.getLastStateName();
//         return exploration.getState(stateName);
//       },
//       getExplorationId: function() {
//         return _explorationId;
//       },
//       getExplorationTitle: function() {
//         return exploration.title;
//       },
//       getExplorationVersion: function() {
//         return version;
//       },
//       getAuthorRecommendedExpIds: function() {
//         return exploration.getAuthorRecommendedExpIds(currentStateName);
//       },
//       getLanguageCode: function() {
//         return exploration.getLanguageCode();
//       },
//       isInPreviewMode: function() {
//         return !!_editorPreviewMode;
//       },
//       submitAnswer: function(answer, interactionRulesService, successCallback) {
//         if (answerIsBeingProcessed) {
//           return;
//         }
//         answerIsBeingProcessed = true;
//         var oldStateName = PlayerTranscriptService.getLastStateName();
//         var oldState = exploration.getState(oldStateName);
//         var recordedVoiceovers = oldState.recordedVoiceovers;
//         var oldStateCard = PlayerTranscriptService.getLastCard();
//         var classificationResult = (
//           AnswerClassificationService.getMatchingClassificationResult(
//             oldStateName, oldStateCard.getInteraction(), answer,
//             interactionRulesService));
//         var answerIsCorrect = classificationResult.outcome.labelledAsCorrect;

//         // Use angular.copy() to clone the object
//         // since classificationResult.outcome points
//         // at oldState.interaction.default_outcome.
//         var outcome = angular.copy(classificationResult.outcome);
//         var newStateName = outcome.dest;

//         if (!_editorPreviewMode) {
//           var feedbackIsUseful = (
//             AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
//               oldStateName, oldState, answer,
//               interactionRulesService));
//           StatsReportingService.recordAnswerSubmitted(
//             oldStateName,
//             LearnerParamsService.getAllParams(),
//             answer,
//             classificationResult.answerGroupIndex,
//             classificationResult.ruleIndex,
//             classificationResult.classificationCategorization,
//             feedbackIsUseful);

//           StatsReportingService.recordAnswerSubmitAction(
//             oldStateName, newStateName, oldState.interaction.id, answer,
//             outcome.feedback);
//         }

//         var refresherExplorationId = outcome.refresherExplorationId;
//         var missingPrerequisiteSkillId = outcome.missingPrerequisiteSkillId;
//         var newState = exploration.getState(newStateName);
//         var isFirstHit = Boolean(visitedStateNames.indexOf(
//           newStateName) === -1);
//         if (oldStateName !== newStateName) {
//           visitedStateNames.push(newStateName);
//         }
//         // Compute the data for the next state.
//         var oldParams = LearnerParamsService.getAllParams();
//         oldParams.answer = answer;
//         var feedbackHtml =
//           makeFeedback(outcome.feedback.html, [oldParams]);
//         var feedbackContentId = outcome.feedback.contentId;
//         var feedbackAudioTranslations = (
//           recordedVoiceovers.getBindableVoiceovers(feedbackContentId));
//         if (feedbackHtml === null) {
//           answerIsBeingProcessed = false;
//           AlertsService.addWarning('Expression parsing error.');
//           return;
//         }
//         var newParams = (
//           newState ? makeParams(
//             oldParams, newState.paramChanges, [oldParams]) : oldParams);
//         if (newParams === null) {
//           answerIsBeingProcessed = false;
//           AlertsService.addWarning('Expression parsing error.');
//           return;
//         }

//         var questionHtml = makeQuestion(newState, [newParams, {
//           answer: 'answer'
//         }]);
//         if (questionHtml === null) {
//           answerIsBeingProcessed = false;
//           AlertsService.addWarning('Expression parsing error.');
//           return;
//         }

//         // TODO(sll): Remove the 'answer' key from newParams.
//         newParams.answer = answer;

//         answerIsBeingProcessed = false;

//         var refreshInteraction = (
//           oldStateName !== newStateName ||
//           exploration.isInteractionInline(oldStateName));
//         nextStateName = newStateName;
//         var onSameCard = (oldStateName === newStateName);

//         _updateActiveStateIfInEditorEventEmitter.emit(newStateName);

//         var _nextFocusLabel = FocusManagerService.generateFocusLabel();
//         var nextInteractionHtml = null;
//         if (exploration.getInteraction(nextStateName).id) {
//           nextInteractionHtml = _getNextInteractionHtml(_nextFocusLabel);
//         }
//         if (newParams) {
//           LearnerParamsService.init(newParams);
//         }

//         questionHtml = questionHtml + _getRandomSuffix();
//         nextInteractionHtml = nextInteractionHtml + _getRandomSuffix();

//         var nextCard = StateCardObjectFactory.createNewCard(
//           nextStateName, questionHtml, nextInteractionHtml,
//           exploration.getInteraction(nextStateName),
//           exploration.getState(nextStateName).recordedVoiceovers,
//           exploration.getState(nextStateName).writtenTranslations,
//           exploration.getState(nextStateName).content.contentId);
//         successCallback(
//           nextCard, refreshInteraction, feedbackHtml,
//           feedbackAudioTranslations, refresherExplorationId,
//           missingPrerequisiteSkillId, onSameCard, null,
//           (oldStateName === exploration.initStateName), isFirstHit, false,
//           _nextFocusLabel);
//         return answerIsCorrect;
//       },
//       isAnswerBeingProcessed: function() {
//         return answerIsBeingProcessed;
//       },
//       getAlwaysAskLearnerForAnswerDetails: function() {
//         return alwaysAskLearnersForAnswerDetails;
//       },
//       get onUpdateActiveStateIfInEditor() {
//         return _updateActiveStateIfInEditorEventEmitter;
//       }
//     };
//   }
// ]);
