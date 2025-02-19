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
 * @fileoverview A service that maintains a record of the state of the player,
 *  like engine service.
 */

import {Injectable, EventEmitter} from '@angular/core';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PretestQuestionBackendApiService} from 'domain/question/pretest-question-backend-api.service';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {
  Question,
  QuestionBackendDict,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {DiagnosticTestTopicTrackerModel} from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {
  ExplorationFeatures,
  ExplorationFeaturesBackendApiService,
} from 'services/exploration-features-backend-api.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {PlaythroughService} from 'services/playthrough.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {ExplorationEngineService} from './exploration-engine.service';
import {NumberAttemptsService} from './number-attempts.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {DiagnosticTestPlayerEngineService} from './diagnostic-test-player-engine.service';
import {StatsReportingService} from './stats-reporting.service';

interface QuestionPlayerConfigDict {
  skillList: string[];
  questionCount: number;
  questionsSortedByDifficulty: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationPlayerStateService {
  private _totalQuestionsReceivedEventEmitter: EventEmitter<number> =
    new EventEmitter();

  private _oppiaFeedbackAvailableEventEmitter: EventEmitter<void> =
    new EventEmitter();

  currentEngineService:
    | ExplorationEngineService
    | QuestionPlayerEngineService
    | DiagnosticTestPlayerEngineService;

  explorationMode: string;
  editorPreviewMode: boolean;
  questionPlayerMode: boolean;
  diagnosticTestPlayerMode: boolean;
  explorationId: string;
  version: number | null;
  storyUrlFragment: string;
  lastCompletedCheckpoint: string;
  isLoggedOutProgressTracked: boolean = false;
  uniqueProgressUrlId: string | null = null;
  private _playerStateChangeEventEmitter: EventEmitter<string> =
    new EventEmitter<string>();

  private _playerProgressModalShownEventEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  constructor(
    private contextService: ContextService,
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private explorationEngineService: ExplorationEngineService,
    private explorationFeaturesBackendApiService: ExplorationFeaturesBackendApiService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private numberAttemptsService: NumberAttemptsService,
    private playerTranscriptService: PlayerTranscriptService,
    private playthroughService: PlaythroughService,
    private pretestQuestionBackendApiService: PretestQuestionBackendApiService,
    private questionBackendApiService: QuestionBackendApiService,
    private questionObjectFactory: QuestionObjectFactory,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private statsReportingService: StatsReportingService,
    private urlService: UrlService
  ) {
    this.init();
  }

  init(): void {
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
      this.editorPreviewMode = this.contextService.isInExplorationEditorPage();
      this.questionPlayerMode = this.contextService.isInQuestionPlayerMode();
      this.explorationId = this.contextService.getExplorationId();
      this.version = this.urlService.getExplorationVersionFromUrl();

      if (
        !this.questionPlayerMode &&
        !(
          'skill_editor' ===
          this.urlService.getPathname().split('/')[1].replace(/"/g, "'")
        )
      ) {
        this.readOnlyExplorationBackendApiService
          .loadExplorationAsync(this.explorationId, this.version)
          .then(exploration => {
            this.version = exploration.version;
          });
      }
    } else {
      this.explorationId = 'test_id';
      this.version = 1;
      this.editorPreviewMode = false;
      this.questionPlayerMode = false;
    }

    this.storyUrlFragment = this.urlService.getStoryUrlFragmentFromLearnerUrl();
  }

  initializeExplorationServices(
    returnDict: FetchExplorationBackendResponse,
    arePretestsAvailable: boolean,
    callback: (stateCard: StateCard, str: string) => void
  ): void {
    // For some cases, version is set only after
    // ReadOnlyExplorationBackendApiService.loadExploration() has completed.
    // Use returnDict.version for non-null version value.
    this.statsReportingService.initSession(
      this.explorationId,
      returnDict.exploration.title,
      returnDict.version,
      returnDict.session_id,
      this.urlService.getCollectionIdFromExplorationUrl()
    );
    this.playthroughService.initSession(
      this.explorationId,
      returnDict.version,
      returnDict.record_playthrough_probability
    );
    this.explorationEngineService.init(
      {
        auto_tts_enabled: returnDict.auto_tts_enabled,
        draft_changes: [],
        is_version_of_draft_valid: true,
        init_state_name: returnDict.exploration.init_state_name,
        param_changes: returnDict.exploration.param_changes,
        param_specs: returnDict.exploration.param_specs,
        states: returnDict.exploration.states,
        title: returnDict.exploration.title,
        draft_change_list_id: returnDict.draft_change_list_id,
        language_code: returnDict.exploration.language_code,
        version: returnDict.version,
        next_content_id_index: returnDict.exploration.next_content_id_index,
        exploration_metadata: returnDict.exploration_metadata,
      },
      returnDict.version,
      returnDict.preferred_audio_language_code,
      returnDict.auto_tts_enabled,
      returnDict.preferred_language_codes,
      returnDict.displayable_language_codes,
      arePretestsAvailable ? () => {} : callback
    );
  }

  initializePretestServices(
    pretestQuestionObjects: Question[],
    callback: (initialCard: StateCard, nextFocusLabel: string) => void
  ): void {
    this.questionPlayerEngineService.init(
      pretestQuestionObjects,
      callback,
      () => {}
    );
  }

  initializeQuestionPlayerServices(
    questionDicts: QuestionBackendDict[],
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    let questionObjects = questionDicts.map(function (questionDict) {
      return this.questionObjectFactory.createFromBackendDict(questionDict);
    }, this);
    this.questionPlayerEngineService.init(
      questionObjects,
      successCallback,
      errorCallback
    );
  }

  setExplorationMode(): void {
    this.explorationMode =
      ExplorationPlayerConstants.EXPLORATION_MODE.EXPLORATION;
    this.currentEngineService = this.explorationEngineService;
  }

  setPretestMode(): void {
    this.explorationMode = ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST;
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setQuestionPlayerMode(): void {
    this.explorationMode =
      ExplorationPlayerConstants.EXPLORATION_MODE.QUESTION_PLAYER;
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setDiagnosticTestPlayerMode(): void {
    this.explorationMode =
      ExplorationPlayerConstants.EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER;
    this.currentEngineService = this.diagnosticTestPlayerEngineService;
  }

  setStoryChapterMode(): void {
    this.explorationMode =
      ExplorationPlayerConstants.EXPLORATION_MODE.STORY_CHAPTER;
    this.currentEngineService = this.explorationEngineService;
  }

  initExplorationPreviewPlayer(
    callback: (sateCard: StateCard, str: string) => void
  ): void {
    this.setExplorationMode();
    Promise.all([
      this.editableExplorationBackendApiService.fetchApplyDraftExplorationAsync(
        this.explorationId
      ),
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        this.explorationId
      ),
    ]).then(combinedData => {
      let explorationData = combinedData[0];
      let featuresData: ExplorationFeatures = combinedData[1];

      this.explorationFeaturesService.init(
        {
          param_changes: explorationData.param_changes,
          states: explorationData.states,
        },
        featuresData
      );
      this.explorationEngineService.init(
        explorationData,
        null,
        null,
        null,
        null,
        [],
        callback
      );
      this.numberAttemptsService.reset();
    });
  }

  initQuestionPlayer(
    questionPlayerConfig: QuestionPlayerConfigDict,
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    this.setQuestionPlayerMode();
    this.questionBackendApiService
      .fetchQuestionsAsync(
        questionPlayerConfig.skillList,
        questionPlayerConfig.questionCount,
        questionPlayerConfig.questionsSortedByDifficulty
      )
      .then(questionData => {
        this._totalQuestionsReceivedEventEmitter.emit(questionData.length);
        this.initializeQuestionPlayerServices(
          questionData,
          successCallback,
          errorCallback
        );
      });
  }

  initExplorationPlayer(
    callback: (stateCard: StateCard, str: string) => void
  ): void {
    let explorationDataPromise = this.version
      ? this.readOnlyExplorationBackendApiService.loadExplorationAsync(
          this.explorationId,
          this.version
        )
      : this.readOnlyExplorationBackendApiService.loadLatestExplorationAsync(
          this.explorationId
        );
    Promise.all([
      explorationDataPromise,
      this.pretestQuestionBackendApiService.fetchPretestQuestionsAsync(
        this.explorationId,
        this.storyUrlFragment
      ),
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        this.explorationId
      ),
    ]).then(combinedData => {
      let explorationData: FetchExplorationBackendResponse = combinedData[0];
      let pretestQuestionsData = combinedData[1];
      let featuresData = combinedData[2];
      this.explorationFeaturesService.init(
        {
          ...explorationData.exploration,
        },
        featuresData
      );
      if (pretestQuestionsData.length > 0) {
        this.setPretestMode();
        this.initializeExplorationServices(explorationData, true, callback);
        this.initializePretestServices(pretestQuestionsData, callback);
      } else if (
        this.urlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
        this.urlService.getUrlParams().hasOwnProperty('node_id')
      ) {
        this.setStoryChapterMode();
        this.initializeExplorationServices(explorationData, false, callback);
      } else {
        this.setExplorationMode();
        this.initializeExplorationServices(explorationData, false, callback);
      }
    });
  }

  initializePlayer(
    callback: (stateCard: StateCard, str: string) => void
  ): void {
    this.playerTranscriptService.init();
    if (this.editorPreviewMode) {
      this.initExplorationPreviewPlayer(callback);
    } else {
      this.initExplorationPlayer(callback);
    }
  }

  initializeQuestionPlayer(
    config: QuestionPlayerConfigDict,
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    this.playerTranscriptService.init();
    this.initQuestionPlayer(config, successCallback, errorCallback);
  }

  initializeDiagnosticPlayer(
    diagnosticTestTopicTrackerModel: DiagnosticTestTopicTrackerModel,
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void
  ): void {
    this.setDiagnosticTestPlayerMode();
    this.diagnosticTestPlayerEngineService.init(
      diagnosticTestTopicTrackerModel,
      successCallback
    );
  }

  getCurrentEngineService():
    | ExplorationEngineService
    | QuestionPlayerEngineService
    | DiagnosticTestPlayerEngineService {
    return this.currentEngineService;
  }

  isInPretestMode(): boolean {
    return (
      this.explorationMode ===
      ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST
    );
  }

  isInQuestionMode(): boolean {
    return (
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST ||
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.QUESTION_PLAYER
    );
  }

  isInQuestionPlayerMode(): boolean {
    return (
      this.explorationMode ===
      ExplorationPlayerConstants.EXPLORATION_MODE.QUESTION_PLAYER
    );
  }

  isPresentingIsolatedQuestions(): boolean {
    // The method returns a boolean value by checking whether the current mode
    // is only presenting the questions or not.
    // The diagnostic player mode, question player mode, and pretest mode are
    // the ones in which only questions are presented to the learner, while in
    // the exploration mode and story chapter mode the learning contents along
    // with questions are presented.
    if (
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.QUESTION_PLAYER ||
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER ||
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST
    ) {
      return true;
    } else if (
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.EXPLORATION ||
      this.explorationMode ===
        ExplorationPlayerConstants.EXPLORATION_MODE.STORY_CHAPTER
    ) {
      return false;
    } else {
      throw new Error('Invalid mode received: ' + this.explorationMode + '.');
    }
  }

  isInDiagnosticTestPlayerMode(): boolean {
    return (
      this.explorationMode ===
      ExplorationPlayerConstants.EXPLORATION_MODE.DIAGNOSTIC_TEST_PLAYER
    );
  }

  isInStoryChapterMode(): boolean {
    return (
      this.explorationMode ===
      ExplorationPlayerConstants.EXPLORATION_MODE.STORY_CHAPTER
    );
  }

  moveToExploration(
    callback: (stateCard: StateCard, label: string) => void
  ): void {
    if (
      this.urlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
      this.urlService.getUrlParams().hasOwnProperty('node_id')
    ) {
      this.setStoryChapterMode();
    } else {
      this.setExplorationMode();
    }
    this.explorationEngineService.moveToExploration(callback);
  }

  setLastCompletedCheckpoint(checkpointStateName: string): void {
    this.lastCompletedCheckpoint = checkpointStateName;
  }

  trackLoggedOutLearnerProgress(): void {
    this.isLoggedOutProgressTracked = true;
  }

  isLoggedOutLearnerProgressTracked(): boolean {
    return this.isLoggedOutProgressTracked;
  }

  async setUniqueProgressUrlId(): Promise<void> {
    await this.editableExplorationBackendApiService
      .recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner(
        this.explorationId,
        this.version,
        this.lastCompletedCheckpoint
      )
      .then(response => {
        this.uniqueProgressUrlId = response.unique_progress_url_id;
        this.trackLoggedOutLearnerProgress();
      });
  }

  getUniqueProgressUrlId(): string {
    return this.uniqueProgressUrlId;
  }

  getLanguageCode(): string {
    return this.currentEngineService.getLanguageCode();
  }

  recordNewCardAdded(): void {
    return this.currentEngineService.recordNewCardAdded();
  }

  skipCurrentQuestion(successCallback: (stateCard: StateCard) => void): void {
    this.diagnosticTestPlayerEngineService.skipCurrentQuestion(successCallback);
  }

  get onTotalQuestionsReceived(): EventEmitter<number> {
    return this._totalQuestionsReceivedEventEmitter;
  }

  get onPlayerStateChange(): EventEmitter<string> {
    return this._playerStateChangeEventEmitter;
  }

  get onOppiaFeedbackAvailable(): EventEmitter<void> {
    return this._oppiaFeedbackAvailableEventEmitter;
  }

  get onShowProgressModal(): EventEmitter<boolean> {
    return this._playerProgressModalShownEventEmitter;
  }
}
