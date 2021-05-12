// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

import { EventEmitter } from '@angular/core';

require('domain/exploration/editable-exploration-backend-api.service.ts');
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/question/pretest-question-backend-api.service.ts');
require('domain/question/question-backend-api.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/number-attempts.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require(
  'pages/exploration-player-page/services/question-player-engine.service.ts');
require(
  'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
require('pages/exploration-player-page/services/stats-reporting.service.ts');
require('services/context.service.ts');
require('services/exploration-features-backend-api.service.ts');
require('services/exploration-features.service.ts');
require('services/playthrough.service.ts');
require('services/contextual/url.service.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');

angular.module('oppia').factory('ExplorationPlayerStateService', [
  '$q', '$rootScope', 'ContextService', 'EditableExplorationBackendApiService',
  'ExplorationEngineService', 'ExplorationFeaturesBackendApiService',
  'ExplorationFeaturesService', 'NumberAttemptsService',
  'PlayerCorrectnessFeedbackEnabledService', 'PlayerTranscriptService',
  'PlaythroughService', 'PretestQuestionBackendApiService',
  'QuestionBackendApiService', 'QuestionPlayerEngineService',
  'ReadOnlyExplorationBackendApiService', 'StatsReportingService', 'UrlService',
  'EXPLORATION_MODE',
  function(
      $q, $rootScope, ContextService, EditableExplorationBackendApiService,
      ExplorationEngineService, ExplorationFeaturesBackendApiService,
      ExplorationFeaturesService, NumberAttemptsService,
      PlayerCorrectnessFeedbackEnabledService, PlayerTranscriptService,
      PlaythroughService, PretestQuestionBackendApiService,
      QuestionBackendApiService, QuestionPlayerEngineService,
      ReadOnlyExplorationBackendApiService, StatsReportingService, UrlService,
      EXPLORATION_MODE) {
    var _totalQuestionsReceivedEventEmitter = new EventEmitter();
    var _oppiaFeedbackAvailableEventEmitter = new EventEmitter();
    var currentEngineService = null;
    var explorationMode = EXPLORATION_MODE.OTHER;
    var editorPreviewMode = ContextService.isInExplorationEditorPage();
    var questionPlayerMode = ContextService.isInQuestionPlayerMode();
    var explorationId = ContextService.getExplorationId();
    var version = UrlService.getExplorationVersionFromUrl();
    if (!questionPlayerMode && !('skill_editor' === UrlService.getPathname()
      .split('/')[1].replace(/"/g, "'"))) {
      ReadOnlyExplorationBackendApiService
        .loadExplorationAsync(explorationId, version)
        .then(function(exploration) {
          version = exploration.version;
          $rootScope.$applyAsync();
        });
    }

    var storyUrlFragment = UrlService.getStoryUrlFragmentFromLearnerUrl();

    var _playerStateChangeEventEmitter = new EventEmitter();

    var initializeExplorationServices = function(
        returnDict, arePretestsAvailable, callback) {
      // For some cases, version is set only after
      // ReadOnlyExplorationBackendApiService.loadExplorationAsync()
      // has completed. Use returnDict.version for non-null version value.
      StatsReportingService.initSession(
        explorationId, returnDict.exploration.title, returnDict.version,
        returnDict.session_id, UrlService.getCollectionIdFromExplorationUrl());
      PlaythroughService.initSession(
        explorationId, returnDict.version,
        returnDict.record_playthrough_probability);
      PlayerCorrectnessFeedbackEnabledService.init(
        returnDict.correctness_feedback_enabled);
      ExplorationEngineService.init(
        returnDict.exploration, returnDict.version,
        returnDict.preferred_audio_language_code,
        returnDict.auto_tts_enabled,
        returnDict.preferred_language_codes,
        arePretestsAvailable ? function() {} : callback);
    };

    var initializePretestServices = function(pretestQuestionDicts, callback) {
      PlayerCorrectnessFeedbackEnabledService.init(true);
      QuestionPlayerEngineService.init(pretestQuestionDicts, callback);
    };

    var initializeQuestionPlayerServices = function(
        questionDicts, successCallback, errorCallback) {
      PlayerCorrectnessFeedbackEnabledService.init(true);
      QuestionPlayerEngineService.init(
        questionDicts, successCallback, errorCallback);
    };

    var setExplorationMode = function() {
      explorationMode = EXPLORATION_MODE.EXPLORATION;
      currentEngineService = ExplorationEngineService;
    };

    var setPretestMode = function() {
      explorationMode = EXPLORATION_MODE.PRETEST;
      currentEngineService = QuestionPlayerEngineService;
    };

    var setQuestionPlayerMode = function() {
      explorationMode = EXPLORATION_MODE.QUESTION_PLAYER;
      currentEngineService = QuestionPlayerEngineService;
    };

    var setStoryChapterMode = function() {
      explorationMode = EXPLORATION_MODE.STORY_CHAPTER;
      currentEngineService = ExplorationEngineService;
    };

    var initExplorationPreviewPlayer = function(callback) {
      setExplorationMode();
      $q.all([
        EditableExplorationBackendApiService.fetchApplyDraftExplorationAsync(
          explorationId),
        ExplorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
          explorationId),
      ]).then(function(combinedData) {
        var explorationData = combinedData[0];
        var featuresData = combinedData[1];
        ExplorationFeaturesService.init(explorationData, featuresData);
        ExplorationEngineService.init(
          explorationData, null, null, null, null, callback);
        PlayerCorrectnessFeedbackEnabledService.init(
          explorationData.correctness_feedback_enabled);
        NumberAttemptsService.reset();
        $rootScope.$applyAsync();
      });
    };

    var initQuestionPlayer = function(
        questionPlayerConfig, successCallback, errorCallback) {
      setQuestionPlayerMode();
      QuestionBackendApiService.fetchQuestionsAsync(
        questionPlayerConfig.skillList,
        questionPlayerConfig.questionCount,
        questionPlayerConfig.questionsSortedByDifficulty
      ).then(function(questionData) {
        _totalQuestionsReceivedEventEmitter.emit(questionData.length);
        initializeQuestionPlayerServices(
          questionData, successCallback, errorCallback);
      });
    };

    var initExplorationPlayer = function(callback) {
      var explorationDataPromise = version ?
        ReadOnlyExplorationBackendApiService.loadExplorationAsync(
          explorationId, version) :
        ReadOnlyExplorationBackendApiService.loadLatestExplorationAsync(
          explorationId);
      $q.all([
        explorationDataPromise,
        PretestQuestionBackendApiService.fetchPretestQuestionsAsync(
          explorationId, storyUrlFragment),
        ExplorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
          explorationId),
      ]).then(function(combinedData) {
        var explorationData = combinedData[0];
        var pretestQuestionsData = combinedData[1];
        var featuresData = combinedData[2];
        ExplorationFeaturesService.init(explorationData, featuresData);
        if (pretestQuestionsData.length > 0) {
          setPretestMode();
          initializeExplorationServices(explorationData, true, callback);
          initializePretestServices(pretestQuestionsData, callback);
        } else if (
          UrlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
          UrlService.getUrlParams().hasOwnProperty('node_id')) {
          setStoryChapterMode();
          initializeExplorationServices(explorationData, false, callback);
        } else {
          setExplorationMode();
          initializeExplorationServices(explorationData, false, callback);
        }
      });
    };

    return {
      initializePlayer: function(callback) {
        PlayerTranscriptService.init();
        if (editorPreviewMode) {
          initExplorationPreviewPlayer(callback);
        } else {
          initExplorationPlayer(callback);
        }
      },
      initializeQuestionPlayer: function(
          config, successCallback, errorCallback) {
        PlayerTranscriptService.init();
        initQuestionPlayer(config, successCallback, errorCallback);
      },
      getCurrentEngineService: function() {
        return currentEngineService;
      },
      isInPretestMode: function() {
        return explorationMode === EXPLORATION_MODE.PRETEST;
      },
      isInQuestionMode: function() {
        return explorationMode === EXPLORATION_MODE.PRETEST ||
        explorationMode === EXPLORATION_MODE.QUESTION_PLAYER;
      },
      isInQuestionPlayerMode: function() {
        return explorationMode === EXPLORATION_MODE.QUESTION_PLAYER;
      },
      isInStoryChapterMode: function() {
        return explorationMode === EXPLORATION_MODE.STORY_CHAPTER;
      },
      getPretestQuestionCount: function() {
        return QuestionPlayerEngineService.getPretestQuestionCount();
      },
      moveToExploration: function(callback) {
        if (
          UrlService.getUrlParams().hasOwnProperty('story_url_fragment') &&
          UrlService.getUrlParams().hasOwnProperty('node_id')) {
          setStoryChapterMode();
        } else {
          setExplorationMode();
        }
        ExplorationEngineService.moveToExploration(callback);
      },
      getLanguageCode: function() {
        return currentEngineService.getLanguageCode();
      },
      recordNewCardAdded: function() {
        return currentEngineService.recordNewCardAdded();
      },
      get onTotalQuestionsReceived() {
        return _totalQuestionsReceivedEventEmitter;
      },
      get onPlayerStateChange() {
        return _playerStateChangeEventEmitter;
      },
      get onOppiaFeedbackAvailable() {
        return _oppiaFeedbackAvailableEventEmitter;
      }
    };
  }]);
