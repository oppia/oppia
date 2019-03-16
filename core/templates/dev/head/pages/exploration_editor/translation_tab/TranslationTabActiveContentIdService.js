// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get and set active content id in translation tab.
 */

require('components/StateGraphLayoutService.js');
require('domain/exploration/EditableExplorationBackendApiService.js');
require('domain/exploration/ParamChangeObjectFactory.js');
require('domain/exploration/ReadOnlyExplorationBackendApiService.js');
require('domain/exploration/RuleObjectFactory.js');
require('domain/feedback_thread/FeedbackThreadObjectFactory.js');
require('domain/state/StateObjectFactory.js');
require('domain/state/StatesObjectFactory.js');
require('domain/suggestion/SuggestionObjectFactory.js');
require('domain/suggestion/SuggestionThreadObjectFactory.js');
require('domain/utilities/UrlInterpolationService.js');
require('pages/exploration_editor/AngularNameService.js');
require('pages/exploration_editor/ChangeListService.js');
require('pages/exploration_editor/ExplorationAutomaticTextToSpeechService.js');
require('pages/exploration_editor/ExplorationCategoryService.js');
require('pages/exploration_editor/ExplorationCorrectnessFeedbackService.js');
require('pages/exploration_editor/ExplorationDataService.js');
require('pages/exploration_editor/ExplorationDiffService.js');
require('pages/exploration_editor/ExplorationEditor.js');
require('pages/exploration_editor/ExplorationInitStateNameService.js');
require('pages/exploration_editor/ExplorationLanguageCodeService.js');
require('pages/exploration_editor/ExplorationObjectiveService.js');
require('pages/exploration_editor/ExplorationParamChangesService.js');
require('pages/exploration_editor/ExplorationParamSpecsService.js');
require('pages/exploration_editor/ExplorationRightsService.js');
require('pages/exploration_editor/ExplorationStatesService.js');
require('pages/exploration_editor/ExplorationTagsService.js');
require('pages/exploration_editor/ExplorationTitleService.js');
require('pages/exploration_editor/ExplorationWarningsService.js');
require('pages/exploration_editor/GraphDataService.js');
require('pages/exploration_editor/ParameterMetadataService.js');
require('pages/exploration_editor/RouterService.js');
require('pages/exploration_editor/UserEmailPreferencesService.js');
require('pages/exploration_editor/feedback_tab/ThreadDataService.js');
require('pages/exploration_editor/feedback_tab/ThreadStatusDisplayService.js');
require('pages/exploration_editor/history_tab/CompareVersionsService.js');
require('pages/exploration_editor/history_tab/VersionTreeService.js');
require('pages/exploration_editor/statistics_tab/StateImprovementSuggestionService.js');
require('pages/exploration_editor/translation_tab/TranslationLanguageService.js');
require('pages/exploration_editor/translation_tab/TranslationStatusService.js');
require('pages/exploration_editor/translation_tab/TranslationTabActiveContentIdService.js');
require('pages/exploration_player/AnswerClassificationService.js');
require('pages/exploration_player/CurrentInteractionService.js');
require('pages/exploration_player/ExplorationEngineService.js');
require('pages/exploration_player/LearnerParamsService.js');
require('pages/exploration_player/NumberAttemptsService.js');
require('pages/exploration_player/PlayerCorrectnessFeedbackEnabledService.js');
require('pages/state_editor/StateEditorService.js');
require('pages/state_editor/StatePropertyServices.js');
require('pages/suggestion_editor/ShowSuggestionModalForEditorViewService.js');
require('services/AlertsService.js');
require('services/AssetsBackendApiService.js');
require('services/AudioPlayerService.js');
require('services/ComputeGraphService.js');
require('services/ContextService.js');
require('services/DateTimeFormatService.js');
require('services/EditabilityService.js');
require('services/ExplorationFeaturesService.js');
require('services/ExplorationHtmlFormatterService.js');
require('services/IdGenerationService.js');
require('services/ImprovementCardService.js');
require('services/ImprovementsService.js');
require('services/PlaythroughIssuesService.js');
require('services/StateRulesStatsService.js');
require('services/UserService.js');
require('services/stateful/FocusManagerService.js');


oppia.factory('TranslationTabActiveContentIdService', [
  '$log', '$rootScope', 'StateContentIdsToAudioTranslationsService',
  function($log, $rootScope, StateContentIdsToAudioTranslationsService) {
    var activeContentId = null;
    return {
      getActiveContentId: function() {
        return activeContentId;
      },
      setActiveContentId: function(contentId) {
        var allContentIds = StateContentIdsToAudioTranslationsService.displayed
          .getAllContentId();
        if (allContentIds.indexOf(contentId) === -1) {
          throw Error('Invalid active content id: ' + contentId);
        }
        activeContentId = contentId;
        $rootScope.$broadcast('activeContentIdChanged');
      }
    };
  }]);
