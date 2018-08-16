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
  'StatsReportingService', 'PlaythroughService',
  'PlayerCorrectnessFeedbackEnabledService', 'PlayerTranscriptService',
  'EditableExplorationBackendApiService', 'PlayerPositionService',
  'ReadOnlyExplorationBackendApiService', 'PretestQuestionBackendApiService',
  'NumberAttemptsService',
  function(
      $log, $q, ExplorationEngineService, PretestEngineService,
      ContextService, UrlService, StateClassifierMappingService,
      StatsReportingService, PlaythroughService,
      PlayerCorrectnessFeedbackEnabledService, PlayerTranscriptService,
      EditableExplorationBackendApiService, PlayerPositionService,
      ReadOnlyExplorationBackendApiService, PretestQuestionBackendApiService,
      NumberAttemptsService) {
    var _currentEngineService = null;
    var _inPretestMode = false;
    var _activeCard = null;
    var _editorPreviewMode = ContextService.isInExplorationEditorPage();
    var _explorationId = ContextService.getExplorationId();
    var _version = GLOBALS.explorationVersion;
    var _storyId = UrlService.getStoryIdInPlayer();

    var _initializeExplorationServices = function(
        returnDict, arePretestsAvailable, callback) {
      StateClassifierMappingService.init(
        returnDict.state_classifier_mapping);
      StatsReportingService.initSession(
        _explorationId, returnDict.exploration.title,
        _version, returnDict.session_id, GLOBALS.collectionId);
      PlaythroughService.initSession(
        _explorationId, _version, returnDict.record_playthrough_probability,
        returnDict.whitelisted_exploration_ids_for_playthroughs);
      PlayerCorrectnessFeedbackEnabledService.init(
        returnDict.correctness_feedback_enabled);
      ExplorationEngineService.init(
        returnDict.exploration, returnDict.version,
        returnDict.preferred_audio_language_code,
        returnDict.auto_tts_enabled,
        arePretestsAvailable ?
        function() {} : callback);
    };

    var _initializePretestServices = function(pretestQuestionDicts, callback) {
      PlayerCorrectnessFeedbackEnabledService.init(true);
      PretestEngineService.init(pretestQuestionDicts, callback);
    };

    var _setExplorationMode = function() {
      _inPretestMode = false;
      _currentEngineService = ExplorationEngineService;
    };

    var _setPretestMode = function() {
      _inPretestMode = true;
      _currentEngineService = PretestEngineService;
    };

    return {
      getCurrentEngineService: function() {
        return _currentEngineService;
      },
      updateActiveCard: function() {
        _activeCard = PlayerTranscriptService.getCard(
          PlayerPositionService.getActiveCardIndex());
      },
      isInPretestMode: function() {
        return _inPretestMode;
      },
      getPretestQuestionCount: function() {
        return PretestEngineService.getPretestQuestionCount();
      },
      moveToExploration: function(callback) {
        _setExplorationMode();
        ExplorationEngineService.moveToExploration(callback);
      },
      doesInteractionSupportHints: function() {
        return _activeCard.doesInteractionSupportHints();
      },
      getCurrentStateName: function() {
        return _currentEngineService.getCurrentStateName();
      },
      getCurrentInteraction: function() {
        return _activeCard.getInteraction();
      },
      getNextInteraction: function() {
        return _currentEngineService.getNextInteraction();
      },
      getCurrentInteractionHtml: function(nextFocusLabel) {
        return _activeCard.getInteractionHtml(nextFocusLabel);
      },
      getNextInteractionHtml: function(nextFocusLabel) {
        return _currentEngineService.getNextInteractionHtml(nextFocusLabel);
      },
      getLanguageCode: function() {
        return _currentEngineService.getLanguageCode();
      },
      getCurrentInteractionInstructions: function() {
        return _activeCard.getInteractionInstructions();
      },
      getNextInteractionInstructions: function() {
        return _currentEngineService.getNextInteractionInstructions();
      },
      isInteractionInline: function() {
        if (_activeCard === null || _activeCard.getInteraction() === null) {
          return true;
        }
        return _activeCard.isInteractionInline();
      },
      isNextInteractionInline: function() {
        return _currentEngineService.isNextInteractionInline();
      },
      isContentAudioTranslationAvailable: function() {
        if (_inPretestMode) {
          return false;
        }
        return _activeCard.isContentAudioTranslationAvailable();
      },
      getNextContentId: function() {
        return _currentEngineService.getNextContentId();
      },
      isCurrentStateTerminal: function() {
        return _activeCard.isCardTerminal();
      },
      isStateShowingConceptCard: function() {
        if (_inPretestMode) {
          return false;
        }
        if (ExplorationEngineService.getCurrentStateName() === null) {
          return true;
        }
        return false;
      },
      getContentIdsToAudioTranslations: function() {
        return _activeCard.getContentIdsToAudioTranslations();
      },
      getNextContentIdsToAudioTranslations: function() {
        return _currentEngineService.getNextContentIdsToAudioTranslations();
      },
      recordNewCardAdded: function() {
        return _currentEngineService.recordNewCardAdded();
      },
      getStateContentAudioTranslations: function() {
        if (_inPretestMode) {
          return null;
        }
        return _activeCard.getAudioTranslations();
      },
      getHints: function() {
        return _currentEngineService.getHints();
      },
      getSolution: function() {
        return _currentEngineService.getSolution();
      },
      getStateContentHtml: function() {
        return _activeCard.getContentHtml();
      },
      initializePlayer: function(callback) {
        PlayerTranscriptService.init();
        if (_editorPreviewMode) {
          _setExplorationMode();
          EditableExplorationBackendApiService.fetchApplyDraftExploration(
            _explorationId).then(function(returnDict) {
            ExplorationEngineService.init(
              returnDict, null, null, null, callback);
            PlayerCorrectnessFeedbackEnabledService.init(
              returnDict.correctness_feedback_enabled);
            NumberAttemptsService.reset();
          });
        } else {
          if (_version) {
            $q.all([
              ReadOnlyExplorationBackendApiService.loadExploration(
                _explorationId, _version),
              PretestQuestionBackendApiService.fetchPretestQuestions(
                _explorationId, _storyId
              )]).then(function(returnValues) {
              if (returnValues[1].length > 0) {
                _setPretestMode();
                _initializeExplorationServices(
                  returnValues[0], true, callback);
                _initializePretestServices(returnValues[1], callback);
              } else {
                _setExplorationMode();
                _initializeExplorationServices(
                  returnValues[0], false, callback);
              }
            });
          } else {
            $q.all([
              ReadOnlyExplorationBackendApiService.loadLatestExploration(
                _explorationId),
              PretestQuestionBackendApiService.fetchPretestQuestions(
                _explorationId, _storyId
              )]).then(function(returnValues) {
              if (returnValues[1].length > 0) {
                _setPretestMode();
                _initializeExplorationServices(
                  returnValues[0], true, callback);
                _initializePretestServices(returnValues[1], callback);
              } else {
                _setExplorationMode();
                _initializeExplorationServices(
                  returnValues[0], false, callback);
              }
            });
          }
        }
      }
    };
  }]);
