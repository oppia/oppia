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

oppia.factory('ExplorationPlayerStateService', [
  '$log', '$q', 'ExplorationEngineService', 'PretestEngineService',
  'ContextService', 'UrlService', 'StateClassifierMappingService',
  'StatsReportingService', 'PlaythroughService', 'PlaythroughIssuesService',
  'PlayerCorrectnessFeedbackEnabledService', 'PlayerTranscriptService',
  'EditableExplorationBackendApiService', 'PlayerPositionService',
  'ReadOnlyExplorationBackendApiService', 'PretestQuestionBackendApiService',
  'NumberAttemptsService',
  function(
      $log, $q, ExplorationEngineService, PretestEngineService,
      ContextService, UrlService, StateClassifierMappingService,
      StatsReportingService, PlaythroughService, PlaythroughIssuesService,
      PlayerCorrectnessFeedbackEnabledService, PlayerTranscriptService,
      EditableExplorationBackendApiService, PlayerPositionService,
      ReadOnlyExplorationBackendApiService, PretestQuestionBackendApiService,
      NumberAttemptsService) {
    var currentEngineService = null;
    var inPretestMode = false;
    var editorPreviewMode = ContextService.isInExplorationEditorPage();
    var explorationId = ContextService.getExplorationId();
    var version = GLOBALS.explorationVersion;
    var storyId = UrlService.getStoryIdInPlayer();

    var initializeExplorationServices = function(
        returnDict, arePretestsAvailable, callback) {
      StateClassifierMappingService.init(
        returnDict.state_classifier_mapping);
      StatsReportingService.initSession(
        explorationId, returnDict.exploration.title,
        version, returnDict.session_id, GLOBALS.collectionId);
      PlaythroughService.initSession(
        explorationId, version, returnDict.record_playthrough_probability);
      PlaythroughIssuesService.initSession(explorationId, version);
      PlayerCorrectnessFeedbackEnabledService.init(
        returnDict.correctness_feedback_enabled);
      ExplorationEngineService.init(
        returnDict.exploration, returnDict.version,
        returnDict.preferred_audio_language_code,
        returnDict.auto_tts_enabled,
        arePretestsAvailable ? function() {} : callback);
    };

    var initializePretestServices = function(pretestQuestionDicts, callback) {
      PlayerCorrectnessFeedbackEnabledService.init(true);
      PretestEngineService.init(pretestQuestionDicts, callback);
    };

    var setExplorationMode = function() {
      inPretestMode = false;
      currentEngineService = ExplorationEngineService;
    };

    var setPretestMode = function() {
      inPretestMode = true;
      currentEngineService = PretestEngineService;
    };

    var initExplorationPlayerForEditorPreview = function() {
      setExplorationMode();
      EditableExplorationBackendApiService.fetchApplyDraftExploration(
        explorationId).then(function(returnDict) {
          ExplorationEngineService.init(
            returnDict, null, null, null, callback);
          PlayerCorrectnessFeedbackEnabledService.init(
            returnDict.correctness_feedback_enabled);
          NumberAttemptsService.reset();
        });
    };

    var initExplorationPlayerAtSpecificVersion = function() {
      $q.all([
        ReadOnlyExplorationBackendApiService.loadExploration(
          explorationId, version),
        PretestQuestionBackendApiService.fetchPretestQuestions(
          explorationId, storyId),
      ]).then(function(returnValues) {
        if (returnValues[1].length > 0) {
          setPretestMode();
          initializeExplorationServices(
            returnValues[0], true, callback);
          initializePretestServices(returnValues[1], callback);
        } else {
          setExplorationMode();
          initializeExplorationServices(
            returnValues[0], false, callback);
        }
      });
    };

    var initExplorationPlayerAtLatestVersion = function() {
      $q.all([
        ReadOnlyExplorationBackendApiService.loadLatestExploration(
          explorationId),
        PretestQuestionBackendApiService.fetchPretestQuestions(
          explorationId, storyId),
      ]).then(function(returnValues) {
        if (returnValues[1].length > 0) {
          setPretestMode();
          initializeExplorationServices(
            returnValues[0], true, callback);
          initializePretestServices(returnValues[1], callback);
        } else {
          setExplorationMode();
          initializeExplorationServices(
            returnValues[0], false, callback);
        }
      });
    };

    return {
      getCurrentEngineService: function() {
        return currentEngineService;
      },
      isInPretestMode: function() {
        return inPretestMode;
      },
      getPretestQuestionCount: function() {
        return PretestEngineService.getPretestQuestionCount();
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
      initializePlayer: function(callback) {
        PlayerTranscriptService.init();
        if (editorPreviewMode) {
          initExplorationPlayerForEditorPreview();
        } else if (version) {
          initExplorationPlayerAtSpecificVersion(version);
        } else {
          initExplorationPlayerAtLatestVersion();
        }
      }
    };
  }]);
