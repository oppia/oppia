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

import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AppConstants} from 'app.constants';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {
  Exploration,
  ExplorationBackendDict,
  ExplorationObjectFactory,
} from 'domain/exploration/ExplorationObjectFactory';
import {ParamChange} from 'domain/exploration/param-change.model';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {Outcome} from 'domain/exploration/outcome.model';
import {StateObjectsBackendDict} from 'domain/exploration/StatesObjectFactory';
import {State} from 'domain/state/state.model';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {TextInputCustomizationArgs} from 'interactions/customization-args-defs';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from './answer-classification.service';
import {AudioPreloaderService} from './audio-preloader.service';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {ImagePreloaderService} from './image-preloader.service';
import {
  ExplorationParams,
  LearnerParamsService,
} from './learner-params.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {StatsReportingService} from './stats-reporting.service';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';
import isEqual from 'lodash/isEqual';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {LearnerAnswerInfoService} from './learner-answer-info.service';

@Injectable({
  providedIn: 'root',
})
export class ExplorationEngineService {
  private _explorationId!: string;

  answerIsBeingProcessed: boolean = false;
  exploration!: Exploration;
  currentStateName!: string;
  nextStateName!: string;
  nextStateIfStuckName!: string | null;

  // This list may contain duplicates. A state name is added to it each time
  // the learner moves to a new card.
  visitedStateNames: string[] = [];

  // Param changes to be used ONLY in editor preview mode.
  manualParamChanges!: ParamChange[];
  initStateName!: string;

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioPreloaderService: AudioPreloaderService,
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private pageContextService: PageContextService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private entityTranslationsService: EntityTranslationsService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private explorationObjectFactory: ExplorationObjectFactory,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private imagePreloaderService: ImagePreloaderService,
    private learnerParamsService: LearnerParamsService,
    private learnerAnswerInfoService: LearnerAnswerInfoService,
    private playerTranscriptService: PlayerTranscriptService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private statsReportingService: StatsReportingService,
    private stateEditorService: StateEditorService,
    private translateService: TranslateService,
    private urlService: UrlService
  ) {
    this.setExplorationProperties();
  }

  /**
   * Initializes exploration-related properties based on the current URL path.
   *
   * This function detects whether the page is within an exploration context
   * (e.g., learner view, editor, skill editor, embed, lesson, etc.).
   * If so, it sets the exploration ID and version using services and fetches
   * the full exploration data unless in question player or skill editor mode.
   * Otherwise, assigns default test values for the ID and version.
   *
   * This method must be called before exploration initialization in most cases.
   */
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
      this._explorationId = this.pageContextService.getExplorationId();
      let version = this.urlService.getExplorationVersionFromUrl();
      this.pageContextService.setExplorationVersion(version);

      const pathSegment = this.urlService
        .getPathname()
        .split('/')[1]
        .replace(/"/g, "'");

      if (
        !this.pageContextService.isInQuestionPlayerMode() &&
        pathSegment !== 'skill_editor'
      ) {
        this.readOnlyExplorationBackendApiService
          .loadExplorationAsync(this._explorationId, version)
          .then(exploration => {
            this.pageContextService.setExplorationVersion(exploration.version);
          });
      }
    } else {
      this._explorationId = 'test_id';
      let version = 1;
      this.pageContextService.setExplorationVersion(version);
    }
  }

  /**
   * Returns a random element from the provided array.
   *
   * @template T
   * @param {readonly T[]} arr - The array from which to select a random element.
   * @returns {T} A randomly selected element from the array.
   */
  randomFromArray<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generates the appropriate feedback to display for a given answer.
   *
   * If the interaction is a TextInput and the outcome is the default one,
   * the function checks if the answer is likely a misspelling. If so, it returns
   * a localized "misspelled answer" response. Otherwise, it interpolates the
   * feedback using the current parameter environment.
   *
   * @param {string} answer - The learner's submitted answer.
   * @param {StateCard} oldStateCard - The StateCard representing the current state.
   * @param {Outcome} outcome - The outcome returned by the classifier.
   * @param {Record<string, string>[]} envs - A list of parameter environments for interpolation.
   * @returns {string} The feedback message to display to the learner.
   */
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
      isEqual(outcome, defaultOutcome);

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

  /**
   * Generates a random string of spaces to force Angular to treat component
   * input values as changed, even when logically they are the same.
   *
   * This is a workaround to force Angular to re-render components when needed.
   *
   * @returns {string} A random string consisting of whitespace characters.
   */
  getRandomSuffix(): string {
    // This is a bit of a hack. When a refresh to a component property
    // happens, Angular compares the new value of the property to its previous
    // value. If they are the same, then the property is not updated.
    // Appending a random suffix makes the new value different from the
    // previous one, and thus indirectly forces a refresh.
    let randomSuffix = '';
    let N = Math.round(Math.random() * 1000);
    for (let i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  /**
   * Evaluates and returns a new set of exploration parameters based on the
   * provided list of parameter changes.
   *
   * Parameters may be generated using either the 'Copier' or 'RandomSelector'
   * generators. If any parameter evaluation fails, an error is thrown.
   *
   * @param {ExplorationParams} oldParams - The base set of parameters to extend.
   * @param {ParamChange[]} paramChanges - A list of parameter changes to apply.
   * @param {Record<string, string>[]} envs - A list of environments used for interpolation.
   * @returns {ExplorationParams} A new object with evaluated parameter values.
   * @throws {Error} If any parameter cannot be evaluated correctly.
   */
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
            newParams[pc.name] = pc.customizationArgs.value || '';
          } else {
            let paramValue = this.expressionInterpolationService.processUnicode(
              pc.customizationArgs.value || '',
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
            pc.customizationArgs.list_of_values || []
          );
        }
        return true;
      })
    ) {
      // All parameters were evaluated successfully.
      return newParams;
    }
    // Evaluation of some parameter failed.
    throw new Error('Parameter evaluation failed.');
  }

  /**
   * Evaluates and returns the question content (HTML) for a given state.
   *
   * @param {State} newState - The state whose content is to be processed.
   * @param {Record<string, string>[]} envs - A list of environments for interpolation.
   * @returns {string} The processed HTML string for the question content.
   */
  makeQuestion(newState: State, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html,
      envs
    );
  }

  /**
   * Loads and initializes the first state of the exploration.
   *
   * This sets the current and next state names to the initial state, processes
   * initial parameter changes, generates HTML for the interaction, and invokes
   * the success callback with the constructed StateCard.
   *
   * Should only be called when the `exploration` object is already initialized.
   *
   * @param {(stateCard: StateCard, str: string) => void} successCallback - Callback function
   *   that is passed the initial StateCard and the focus label once the state is loaded.
   */
  loadInitialState(
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

    let interaction = this.exploration.getInteraction(
      this.exploration.initStateName
    );
    let nextFocusLabel: string = this.focusManagerService.generateFocusLabel();

    let interactionId = interaction.id;
    let interactionHtml = null;
    let interactionCustomizationArgs =
      this.exploration.getInteractionCustomizationArgs(this.currentStateName);
    if (interactionCustomizationArgs === null) {
      this.alertsService.addWarning(
        'Interaction customization args cannot be null.'
      );
      return;
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

    if (!this.pageContextService.isInExplorationEditorPage()) {
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
      initialState.content.contentId
    );
    successCallback(initialCard, nextFocusLabel);
  }

  /**
   * Initializes exploration parameters.
   *
   * This sets parameter values based on the default exploration-level parameter
   * specifications and applies any manual parameter changes provided (typically
   * used in editor preview mode).
   *
   * @param {ParamChange[]} manualParamChanges - A list of manually provided parameter changes
   *   (used in preview mode).
   */
  private _initParams(manualParamChanges: ParamChange[]): void {
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

  /**
   * Generates the HTML string for an interaction for the given state.
   *
   * This method fetches the interaction ID and customization arguments for
   * the given state name, and uses the HTML formatter service to generate the
   * corresponding HTML. It throws an error if the interaction ID or customization
   * arguments are not defined.
   *
   * @param {string} labelForFocusTarget - The label used for managing screen reader focus.
   * @param {string} stateName - The name of the state whose interaction HTML is to be generated.
   * @returns {string} The formatted HTML for the state's interaction.
   * @throws {Error} If the interaction ID or customization arguments are null.
   */
  private _getInteractionHtmlByStateName(
    labelForFocusTarget: string,
    stateName: string
  ): string {
    let interactionId = this.exploration.getInteractionId(stateName);

    if (interactionId === null) {
      throw new Error('Interaction id cannot be null.');
    }

    let interactionCustomizationArgs =
      this.exploration.getInteractionCustomizationArgs(stateName);
    if (interactionCustomizationArgs === null) {
      throw new Error('Interaction customization args cannot be null.');
    }

    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      interactionCustomizationArgs,
      true,
      labelForFocusTarget,
      null
    );
  }

  /**
   * Sets up the exploration state and parameters from the editor preview.
   *
   * This method is used **only** in exploration editor preview mode. It sets
   * the initial state name and any manually defined parameter changes so that
   * the preview behaves like a real learner session.
   *
   * @param {string} activeStateNameFromPreviewTab - The name of the state selected in the preview tab.
   * @param {ParamChange[]} manualParamChangesToInit - A list of parameter changes to initialize.
   * @throws {Error} If called outside the exploration editor context.
   */
  initSettingsFromEditor(
    activeStateNameFromPreviewTab: string,
    manualParamChangesToInit: ParamChange[]
  ): void {
    if (this.pageContextService.isInExplorationEditorPage()) {
      this.manualParamChanges = manualParamChangesToInit;
      this.initStateName = activeStateNameFromPreviewTab;
    } else {
      throw new Error('Cannot populate exploration in learner mode.');
    }
  }

  /**
   * Initializes the learner view of the exploration and loads the initial state.
   *
   * This method is responsible for setting up services related to audio,
   * images, translations, and learner parameters. It supports both learner mode
   * and editor preview mode (if called after `initSettingsFromEditor`).
   *
   * @param {ExplorationBackendDict} explorationDict - The backend dictionary containing exploration data.
   * @param {number | null} explorationVersion - The current version of the exploration.
   * @param {string | null} preferredAudioLanguage - The learner's preferred audio language.
   * @param {boolean | null} autoTtsEnabled - Whether automatic text-to-speech is enabled.
   * @param {string[]} preferredContentLanguageCodes - List of preferred content languages for translations.
   * @param {string[]} displayableLanguageCodes - List of available content languages for display.
   * @param {(stateCard: StateCard, label: string) => void} successCallback - Callback to execute after
   *   loading the initial state, receiving the generated StateCard and focus label.
   *
   * @throws {Error} If the initial state name is null or the exploration version is not set.
   */
  init(
    explorationDict: ExplorationBackendDict,
    explorationVersion: number | null,
    preferredAudioLanguage: string | null,
    autoTtsEnabled: boolean | null,
    preferredContentLanguageCodes: string[],
    displayableLanguageCodes: string[],
    successCallback: (stateCard: StateCard, label: string) => void
  ): void {
    this.exploration =
      this.explorationObjectFactory.createFromBackendDict(explorationDict);
    this.answerIsBeingProcessed = false;
    let initStateName = this.exploration.getInitialState().name;
    if (initStateName === null) {
      throw new Error('Initial state name cannot be null.');
    }
    if (this.pageContextService.isInExplorationEditorPage()) {
      this.exploration.setInitialStateName(this.initStateName);
      this.visitedStateNames = [initStateName];
      this._initParams(this.manualParamChanges);
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(this.initStateName);
      this.loadInitialState(successCallback);
    } else {
      this.visitedStateNames.push(initStateName);
      this.pageContextService.setExplorationVersion(explorationVersion);
      this._initParams([]);
      this.audioPreloaderService.init(this.exploration);
      this.audioPreloaderService.kickOffAudioPreloader(initStateName);
      this.imagePreloaderService.init(this.exploration);
      this.imagePreloaderService.kickOffImagePreloader(initStateName);
      this.learnerAnswerInfoService.checkAlwaysAskLearnersForAnswerDetails();
      this.loadInitialState(successCallback);
    }

    const version = this.pageContextService.getExplorationVersion();
    if (!version) {
      throw new Error('Exploration version is not set.');
    }

    this.entityTranslationsService.init(
      this._explorationId,
      'exploration',
      version
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

  /**
   * Updates the current state name to reflect that a new card
   * (i.e., a new state) has been added to the player's transcript.
   *
   * This is typically called after navigating to a new state.
   */
  recordNewCardAdded(): void {
    this.currentStateName = this.nextStateName;
  }

  /**
   * Retrieves the current State object based on the last state name
   * recorded in the player's transcript.
   *
   * @returns {State} The current State object.
   */
  getState(): State {
    let stateName: string = this.playerTranscriptService.getLastStateName();
    return this.exploration.getState(stateName);
  }

  /**
   * Retrieves the State object corresponding to the provided state name.
   *
   * @param {string} stateName - The name of the state to retrieve.
   * @returns {State} The corresponding State object.
   */
  getStateFromStateName(stateName: string): State {
    return this.exploration.getState(stateName);
  }

  /**
   * Returns a list of exploration IDs that the author recommends
   * for the given state.
   *
   * These are typically shown to the learner as suggested next steps.
   *
   * @param {string} stateName - The name of the state for which to fetch recommendations.
   * @returns {string[]} A list of recommended exploration IDs.
   */
  getAuthorRecommendedExpIdsByStateName(stateName: string): string[] {
    let authorRecommendedExpIds =
      this.exploration.getAuthorRecommendedExpIds(stateName);
    return authorRecommendedExpIds ? authorRecommendedExpIds : [];
  }

  /**
   * Returns the language code for the current exploration.
   *
   * @returns {string} The language code (e.g., 'en', 'hi').
   */
  getLanguageCode(): string {
    return this.exploration.getLanguageCode();
  }

  /**
   * Handles the submission of an answer by the learner.
   *
   * This function classifies the answer using the provided interaction rules,
   * records learner statistics, computes feedback and parameters for the next
   * state, and generates the next StateCard to be displayed.
   *
   * If applicable, it also generates a special "stuck state" card used in
   * scenarios where the learner is not progressing.
   *
   * @param {string} answer - The learner's submitted answer.
   * @param {InteractionRulesService} interactionRulesService - The service used to classify the answer.
   * @param {Function} successCallback - Callback that is called after successful processing
   *   of the answer. It receives the next StateCard and other context information:
   *   - nextCard: The generated StateCard for the next state.
   *   - refreshInteraction: Whether the interaction should be refreshed.
   *   - feedbackHtml: HTML string representing feedback to the learner.
   *   - refresherExplorationId: ID of an exploration to refer the learner to (if applicable).
   *   - missingPrerequisiteSkillId: ID of a missing skill (if applicable).
   *   - remainOnCurrentCard: Whether the learner remains on the same state.
   *   - taggedSkillMisconceptionId: ID of a tagged misconception (currently unused).
   *   - wasOldStateInitial: Whether the current state was the initial state.
   *   - isFirstHit: Whether this is the learner’s first time visiting the new state.
   *   - isFinalQuestion: Whether the question was the final one (currently unused).
   *   - nextCardIfReallyStuck: A special fallback card if learner is stuck.
   *   - focusLabel: The label used for accessibility focus management.
   *
   * @returns {boolean} Whether the answer is classified as correct.
   */
  submitAnswer(
    answer: string,
    interactionRulesService: InteractionRulesService,
    successCallback: (
      nextCard: StateCard,
      refreshInteraction: boolean,
      feedbackHtml: string,
      refresherExplorationId: string | null,
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
      return false;
    }
    this.answerIsBeingProcessed = true;
    let oldStateName: string = this.playerTranscriptService.getLastStateName();
    let oldState: State = this.exploration.getState(oldStateName);
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

    if (!this.pageContextService.isInExplorationEditorPage()) {
      let feedbackIsUseful: boolean =
        this.answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          oldStateName,
          oldState,
          answer,
          interactionRulesService
        );
      if (classificationResult.ruleIndex === null) {
        this.alertsService.addWarning(
          'No rule matched for the submitted answer.'
        );
        this.answerIsBeingProcessed = false;
        return false;
      }
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

      let interactionId = oldState.interaction.id;
      if (interactionId === null) {
        this.alertsService.addWarning('Interaction id cannot be null.');
        this.answerIsBeingProcessed = false;
        return false;
      }

      this.statsReportingService.recordAnswerSubmitAction(
        oldStateName,
        newStateName,
        interactionId,
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
    if (feedbackHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Feedback content should not be empty.');
      return false;
    }
    let newParams = newState
      ? this.makeParams(oldParams, newState.paramChanges, [oldParams])
      : oldParams;
    if (newParams === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Parameters should not be empty.');
      return false;
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
      return false;
    }

    // TODO(sll): Remove the 'answer' key from newParams.
    newParams.answer = answer;

    this.answerIsBeingProcessed = false;

    let refreshInteraction =
      oldStateName !== newStateName ||
      this.exploration.isInteractionInline(oldStateName);
    this.nextStateName = newStateName;
    let onSameCard: boolean = oldStateName === newStateName;

    this.stateEditorService.onUpdateActiveStateIfInEditor.emit(newStateName);

    let _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextInteractionHtml = null;
    let interaction = this.exploration.getInteraction(this.nextStateName);
    if (!interaction) {
      this.alertsService.addWarning(
        'Interaction for the next state is not defined.'
      );
      return false;
    }
    if (interaction.id) {
      nextInteractionHtml = this._getInteractionHtmlByStateName(
        _nextFocusLabel,
        this.nextStateName
      );
    }

    if (newParams) {
      this.learnerParamsService.init(newParams);
    }

    questionHtml = questionHtml + this.getRandomSuffix();
    nextInteractionHtml = nextInteractionHtml + this.getRandomSuffix();
    let contentId = this.exploration.getState(this.nextStateName).content
      .contentId;
    if (contentId === null) {
      this.alertsService.addWarning('Content id cannot be null.');
      return false;
    }

    let nextCard = StateCard.createNewCard(
      this.nextStateName,
      questionHtml,
      nextInteractionHtml,
      interaction,
      contentId
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

  /**
   * Computes the fallback StateCard to show if the learner is determined to be
   * "really stuck" (e.g., consistently giving incorrect responses).
   *
   * This method generates the question content and interaction HTML for the
   * fallback state (if provided), and constructs a new StateCard for it.
   *
   * @param {string} answer - The learner’s submitted answer.
   * @param {string | null} newStateNameIfStuck - The name of the fallback state to move to.
   * @param {ExplorationParams} oldParams - The current exploration parameters.
   * @param {string} nextFocusLabel - The label used for accessibility focus management.
   *
   * @returns {StateCard | null} A StateCard for the fallback state, or null if no fallback exists.
   * @throws {Error} If the content ID of the fallback state is null.
   */
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
    let interaction = this.exploration.getInteraction(
      this.nextStateIfStuckName
    );
    if (!interaction) {
      this.alertsService.addWarning(
        'Interaction for the next state if stuck is not defined.'
      );
      return null;
    }

    if (interaction.id) {
      nextInteractionIfStuckHtml = this._getInteractionHtmlByStateName(
        nextFocusLabel,
        this.nextStateIfStuckName
      );
    }

    questionHtmlIfStuck = questionHtmlIfStuck + this.getRandomSuffix();
    nextInteractionIfStuckHtml =
      nextInteractionIfStuckHtml + this.getRandomSuffix();

    let contentId = this.exploration.getState(this.nextStateIfStuckName).content
      .contentId;

    return StateCard.createNewCard(
      this.nextStateIfStuckName,
      questionHtmlIfStuck,
      nextInteractionIfStuckHtml,
      interaction,
      contentId
    );
  }

  /**
   * Returns a new StateCard object for the given state name.
   *
   * This function generates the HTML for both the content and interaction
   * of the specified state, appends random suffixes for uniqueness,
   * and ensures the contentId is not null. It throws an error if the
   * interaction is not defined or if contentId is null.
   *
   * @param {string} stateName - The name of the state to get the StateCard for.
   * @returns {StateCard} A newly created StateCard object for the given state.
   * @throws {Error} If the interaction for the state is not defined.
   * @throws {Error} If the content ID of the state is null.
   */
  getStateCardByName(stateName: string): StateCard {
    const _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let interactionHtml = null;
    let interaction = this.exploration.getInteraction(stateName);
    if (!interaction) {
      throw new Error('Interaction for the state is not defined.');
    }
    if (interaction.id) {
      interactionHtml = this._getInteractionHtmlByStateName(
        _nextFocusLabel,
        stateName
      );
    }
    let contentHtml =
      this.exploration.getState(stateName).content.html +
      this.getRandomSuffix();
    interactionHtml = interactionHtml + this.getRandomSuffix();

    let contentId = this.exploration.getState(stateName).content.contentId;
    if (contentId === null) {
      throw new Error('Content id cannot be null.');
    }

    return StateCard.createNewCard(
      stateName,
      contentHtml,
      interactionHtml,
      interaction,
      contentId
    );
  }

  /**
   * Returns the shortest path (as an array of state names) from the initial
   * state to the specified destination state.
   *
   * The path is computed using a breadth-first search over the state graph
   * constructed from all possible answer groups and default outcomes.
   *
   * @param {StateObjectsBackendDict} allStates - A dictionary of all state objects.
   * @param {string} destStateName - The name of the destination state.
   * @returns {string[]} The list of state names representing the shortest path
   *   from the initial state to the destination state.
   */
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
    let nodeToParentMap: Record<string, string> | null = {};
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
