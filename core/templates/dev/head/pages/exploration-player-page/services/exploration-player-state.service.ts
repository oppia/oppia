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

require('domain/exploration/EditableExplorationBackendApiService.ts');
require('domain/exploration/ReadOnlyExplorationBackendApiService.ts');
require('domain/question/PretestQuestionBackendApiService.ts');
require('domain/question/QuestionBackendApiService.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/number-attempts.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require(
  'pages/exploration-player-page/services/question-player-engine.service.ts');
require(
  'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
require('pages/exploration-player-page/services/stats-reporting.service.ts');
require('services/ContextService.ts');
require('services/ExplorationFeaturesBackendApiService.ts');
require('services/ExplorationFeaturesService.ts');
require('services/PlaythroughIssuesService.ts');
require('services/PlaythroughService.ts');
require('services/contextual/UrlService.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');

angular.module('oppia').factory('ExplorationPlayerStateService', [
  '$q', '$rootScope', 'ContextService',
  'EditableExplorationBackendApiService',
  'ExplorationEngineService', 'ExplorationFeaturesBackendApiService',
  'ExplorationFeaturesService', 'NumberAttemptsService',
  'PlayerCorrectnessFeedbackEnabledService',
  'PlayerTranscriptService', 'PlaythroughIssuesService', 'PlaythroughService',
  'PretestQuestionBackendApiService',
  'QuestionBackendApiService', 'QuestionPlayerEngineService',
  'ReadOnlyExplorationBackendApiService', 'StateClassifierMappingService',
  'StatsReportingService', 'UrlService', 'EXPLORATION_MODE',
  function(
      $q, $rootScope, ContextService,
      EditableExplorationBackendApiService,
      ExplorationEngineService, ExplorationFeaturesBackendApiService,
      ExplorationFeaturesService, NumberAttemptsService,
      PlayerCorrectnessFeedbackEnabledService,
      PlayerTranscriptService, PlaythroughIssuesService, PlaythroughService,
      PretestQuestionBackendApiService,
      QuestionBackendApiService, QuestionPlayerEngineService,
      ReadOnlyExplorationBackendApiService, StateClassifierMappingService,
      StatsReportingService, UrlService, EXPLORATION_MODE) {
    var currentEngineService = null;
    var explorationMode = EXPLORATION_MODE.OTHER;
    var editorPreviewMode = ContextService.isInExplorationEditorPage();
    var questionPlayerMode = ContextService.isInQuestionPlayerMode();
    var explorationId = ContextService.getExplorationId();
    var version = UrlService.getExplorationVersionFromUrl();
    if (!questionPlayerMode) {
      ReadOnlyExplorationBackendApiService
        .loadExploration(explorationId, version)
        .then(function(exploration) {
          version = exploration.version;
        });
    }

    var storyId = UrlService.getStoryIdInPlayer();

    var initializeExplorationServices = function(
        returnDict, arePretestsAvailable, callback) {
      StateClassifierMappingService.init(returnDict.state_classifier_mapping);
      StatsReportingService.initSession(
        explorationId, returnDict.exploration.title, version,
        returnDict.session_id, UrlService.getCollectionIdFromExplorationUrl());
      PlaythroughService.initSession(
        explorationId, version, returnDict.record_playthrough_probability);
      PlaythroughIssuesService.initSession(explorationId, version);
      PlayerCorrectnessFeedbackEnabledService.init(
        returnDict.correctness_feedback_enabled);
      ExplorationEngineService.init(
        returnDict.exploration, returnDict.version,
        returnDict.preferred_audio_language_code, returnDict.auto_tts_enabled,
        arePretestsAvailable ? function() {} : callback);
    };

    var initializePretestServices = function(pretestQuestionDicts, callback) {
      PlayerCorrectnessFeedbackEnabledService.init(true);
      QuestionPlayerEngineService.init(pretestQuestionDicts, callback);
    };

    var initializeQuestionPlayerServices = function(questionDicts, callback) {
      PlayerCorrectnessFeedbackEnabledService.init(true);
      QuestionPlayerEngineService.init(questionDicts, callback);
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
        EditableExplorationBackendApiService.fetchApplyDraftExploration(
          explorationId),
        ExplorationFeaturesBackendApiService.fetchExplorationFeatures(
          explorationId),
      ]).then(function(combinedData) {
        var explorationData = combinedData[0];
        var featuresData = combinedData[1];
        ExplorationFeaturesService.init(explorationData, featuresData);
        ExplorationEngineService.init(
          explorationData, null, null, null, callback);
        PlayerCorrectnessFeedbackEnabledService.init(
          explorationData.correctness_feedback_enabled);
        NumberAttemptsService.reset();
      });
    };

    var initQuestionPlayer = function(questionPlayerConfig, callback) {
      setQuestionPlayerMode();
      QuestionBackendApiService.fetchQuestions(
        questionPlayerConfig.skillList,
        questionPlayerConfig.questionCount).then(function(questionData) {
        $rootScope.$broadcast('totalQuestionsReceived', questionData.length);
        initializeQuestionPlayerServices(questionData, callback);
      });
    };

    var initExplorationPlayer = function(callback) {
      var explorationDataPromise = version ?
        ReadOnlyExplorationBackendApiService.loadExploration(
          explorationId, version) :
        ReadOnlyExplorationBackendApiService.loadLatestExploration(
          explorationId);
      $q.all([
        explorationDataPromise,
        PretestQuestionBackendApiService.fetchPretestQuestions(
          explorationId, storyId),
        ExplorationFeaturesBackendApiService.fetchExplorationFeatures(
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
          UrlService.getUrlParams().hasOwnProperty('story_id') &&
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
      initializeQuestionPlayer: function(config, callback) {
        PlayerTranscriptService.init();
        initQuestionPlayer(config, callback);
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
        setExplorationMode();
        ExplorationEngineService.moveToExploration(callback);
      },
      getLanguageCode: function() {
        return currentEngineService.getLanguageCode();
      },
      recordNewCardAdded: function() {
        return currentEngineService.recordNewCardAdded();
      },
    };
  }]);
