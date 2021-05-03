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

import { Injectable, EventEmitter } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ExplorationBackendDict } from 'domain/exploration/ExplorationObjectFactory';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { PretestQuestionBackendApiService } from 'domain/question/pretest-question-backend-api.service';
import { QuestionBackendApiService } from 'domain/question/question-backend-api.service';
import { QuestionBackendDict } from 'domain/question/QuestionObjectFactory';
import { StateCard } from 'domain/state_card/StateCardObjectFactory';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationFeatures, ExplorationFeaturesBackendApiService } from 'services/exploration-features-backend-api.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { PlaythroughService } from 'services/playthrough.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { ExplorationEngineService } from './exploration-engine.service';
import { NumberAttemptsService } from './number-attempts.service';
import { PlayerCorrectnessFeedbackEnabledService } from './player-correctness-feedback-enabled.service';
import { PlayerTranscriptService } from './player-transcript.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';
import { StatsReportingService } from './stats-reporting.service';

interface QuestionPlayerConfigDict {
  skillList: string[],
  questionCount: number,
  questionsSortedByDifficulty: boolean
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationPlayerStateService {
  private _totalQuestionsReceivedEventEmitter: EventEmitter<number> = (
    new EventEmitter());
  private _oppiaFeedbackAvailableEventEmitter: EventEmitter<void> = (
    new EventEmitter());
  currentEngineService: ExplorationEngineService | QuestionPlayerEngineService;
  explorationMode: string = ExplorationPlayerConstants.EXPLORATION_MODE.OTHER;
  editorPreviewMode: boolean;
  questionPlayerMode: boolean;
  explorationId: string;
  version: number;
  storyUrlFragment: string;
  private _playerStateChangeEventEmitter: EventEmitter<void> = (
    new EventEmitter());

  constructor(
    private contextService: ContextService,
    private editableExplorationBackendApiService:
    EditableExplorationBackendApiService,
    private explorationEngineService:
    ExplorationEngineService,
    private explorationFeaturesBackendApiService:
    ExplorationFeaturesBackendApiService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private numberAttemptsService: NumberAttemptsService,
    private playerCorrectnessFeedbackEnabledService:
    PlayerCorrectnessFeedbackEnabledService,
    private playerTranscriptService:
    PlayerTranscriptService,
    private playthroughService: PlaythroughService,
    private pretestQuestionBackendApiService: PretestQuestionBackendApiService,
    private questionBackendApiService: QuestionBackendApiService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private statsReportingService: StatsReportingService,
    private urlService: UrlService
  ) {
    this.editorPreviewMode = this.contextService.isInExplorationEditorPage();
    this.questionPlayerMode = this.contextService.isInQuestionPlayerMode();
    this.explorationId = this.contextService.getExplorationId();
    this.version = urlService.getExplorationVersionFromUrl();

    if (!this.questionPlayerMode &&
    !('skill_editor' === this.urlService.getPathname()
      .split('/')[1].replace(/"/g, "'"))) {
      this.readOnlyExplorationBackendApiService.loadExploration(
        this.explorationId, this.version).then((exploration) => {
        this.version = exploration.version;
      });
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
      this.explorationId, returnDict.exploration.title, returnDict.version,
      returnDict.session_id,
      this.urlService.getCollectionIdFromExplorationUrl());
    this.playthroughService.initSession(
      this.explorationId, returnDict.version,
      returnDict.record_playthrough_probability);
    this.playerCorrectnessFeedbackEnabledService.init(
      returnDict.correctness_feedback_enabled);
    this.explorationEngineService.init(
      returnDict.exploration, returnDict.version,
      returnDict.preferred_audio_language_code,
      returnDict.auto_tts_enabled,
      returnDict.preferred_language_codes,
      arePretestsAvailable ? () => {} : callback);
  }

  initializePretestServices(
      pretestQuestionDicts: QuestionBackendDict[],
      callback: (
        initialCard: StateCard, nextFocusLabel: string) => void): void {
    this.playerCorrectnessFeedbackEnabledService.init(true);
    this.questionPlayerEngineService.init(
      pretestQuestionDicts, callback, () => {});
  }

  initializeQuestionPlayerServices(
      questionDicts: QuestionBackendDict[],
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void): void {
    this.playerCorrectnessFeedbackEnabledService.init(true);
    this.questionPlayerEngineService.init(
      questionDicts, successCallback, errorCallback);
  }

  setExplorationMode(): void {
    this.explorationMode = ExplorationPlayerConstants
      .EXPLORATION_MODE.EXPLORATION;
    this.currentEngineService = this.explorationEngineService;
    console.log('HIT 1');
    console.log(this.currentEngineService);
  }

  setPretestMode(): void {
    this.explorationMode = ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST;
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setQuestionPlayerMode(): void {
    this.explorationMode = ExplorationPlayerConstants
      .EXPLORATION_MODE.QUESTION_PLAYER;
    this.currentEngineService = this.questionPlayerEngineService;
  }

  setStoryChapterMode(): void {
    this.explorationMode = ExplorationPlayerConstants
      .EXPLORATION_MODE.STORY_CHAPTER;
    this.currentEngineService = this.explorationEngineService;
  }

  initExplorationPreviewPlayer(
      callback: (sateCard: StateCard, str: string) => void): void {
    this.setExplorationMode();
    Promise.all([
      this.editableExplorationBackendApiService.fetchApplyDraftExploration(
        this.explorationId),
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        this.explorationId),
    ]).then((combinedData) => {
      let explorationData: ExplorationBackendDict = combinedData[0];
      let featuresData: ExplorationFeatures = combinedData[1];

      this.explorationFeaturesService.init({
        param_changes: explorationData.param_changes,
        states: explorationData.states
      }, featuresData);
      this.explorationEngineService.init(
        explorationData, null, null, null, null, callback);
      this.playerCorrectnessFeedbackEnabledService.init(
        explorationData.correctness_feedback_enabled);
      this.numberAttemptsService.reset();
    });
  }

  initQuestionPlayer(
      questionPlayerConfig: QuestionPlayerConfigDict,
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void): void {
    this.setQuestionPlayerMode();
    this.questionBackendApiService.fetchQuestionsAsync(
      questionPlayerConfig.skillList,
      questionPlayerConfig.questionCount,
      questionPlayerConfig.questionsSortedByDifficulty
    ).then((questionData) => {
      this._totalQuestionsReceivedEventEmitter.emit(questionData.length);
      this.initializeQuestionPlayerServices(
        questionData, successCallback, errorCallback);
    });
  }

  initExplorationPlayer(
      callback: (stateCard: StateCard, str: string) => void): void {
    let explorationDataPromise = this.version ?
      this.readOnlyExplorationBackendApiService.loadExploration(
        this.explorationId, this.version) :
      this.readOnlyExplorationBackendApiService.loadLatestExploration(
        this.explorationId);
    Promise.all([
      explorationDataPromise,
      this.pretestQuestionBackendApiService.fetchPretestQuestionsAsync(
        this.explorationId, this.storyUrlFragment),
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        this.explorationId),
    ]).then((combinedData) => {
      let explorationData: FetchExplorationBackendResponse = combinedData[0];
      let pretestQuestionsData = combinedData[1];
      let featuresData = combinedData[2];
      this.explorationFeaturesService.init({
        ...explorationData.exploration,
      }, featuresData);
      if (pretestQuestionsData.length > 0) {
        this.setPretestMode();
        this.initializeExplorationServices(explorationData, true, callback);
        this.initializePretestServices(pretestQuestionsData, callback);
      } else if (
        this.urlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
        this.urlService.getUrlParams().hasOwnProperty('node_id')) {
        this.setStoryChapterMode();
        this.initializeExplorationServices(explorationData, false, callback);
      } else {
        this.setExplorationMode();
        this.initializeExplorationServices(explorationData, false, callback);
      }
    });
  }

  initializePlayer(
      callback: (stateCard: StateCard, str: string) => void): void {
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
      errorCallback: () => void): void {
    this.playerTranscriptService.init();
    this.initQuestionPlayer(config, successCallback, errorCallback);
  }

  getCurrentEngineService():
    ExplorationEngineService | QuestionPlayerEngineService {
    return this.currentEngineService;
  }

  isInPretestMode(): boolean {
    return this.explorationMode ===
    ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST;
  }

  isInQuestionMode(): boolean {
    return this.explorationMode === ExplorationPlayerConstants
      .EXPLORATION_MODE.PRETEST || this.explorationMode ===
      ExplorationPlayerConstants.EXPLORATION_MODE.QUESTION_PLAYER;
  }

  isInQuestionPlayerMode(): boolean {
    return this.explorationMode === ExplorationPlayerConstants
      .EXPLORATION_MODE.QUESTION_PLAYER;
  }

  isInStoryChapterMode(): boolean {
    return this.explorationMode ===
    ExplorationPlayerConstants.EXPLORATION_MODE.STORY_CHAPTER;
  }

  moveToExploration(
      callback: (stateCard: StateCard, label: string) => void): void {
    if (
      this.urlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
      this.urlService.getUrlParams().hasOwnProperty('node_id')) {
      this.setStoryChapterMode();
    } else {
      this.setExplorationMode();
    }
    this.explorationEngineService.moveToExploration(callback);
  }

  getLanguageCode(): string {
    console.log('HIT 2');
    return this.currentEngineService.getLanguageCode();
  }

  recordNewCardAdded(): void {
    return this.currentEngineService.recordNewCardAdded();
  }

  get onTotalQuestionsReceived(): EventEmitter<number> {
    return this._totalQuestionsReceivedEventEmitter;
  }

  get onPlayerStateChange(): EventEmitter<void> {
    return this._playerStateChangeEventEmitter;
  }

  get onOppiaFeedbackAvailable(): EventEmitter<void> {
    return this._oppiaFeedbackAvailableEventEmitter;
  }
}

angular.module('oppia').factory('ExplorationPlayerStateService',
  downgradeInjectable(ExplorationPlayerStateService));
