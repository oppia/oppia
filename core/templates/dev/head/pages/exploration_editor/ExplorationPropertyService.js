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
 * @fileoverview Services for storing exploration properties for
 * displaying and editing them in multiple places in the UI,
 * with base class as ExplorationPropertyService.
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
require('domain/utilities/LanguageUtilService.js');
require('domain/utilities/UrlInterpolationService.js');
require('pages/exploration_editor/AngularNameService.js');
require('pages/exploration_editor/AutosaveInfoModalsService.js');
require('pages/exploration_editor/ChangeListService.js');
require('pages/exploration_editor/ChangesInHumanReadableFormService.js');
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
require('pages/exploration_editor/ExplorationPropertyService.js');
require('pages/exploration_editor/ExplorationRightsService.js');
require('pages/exploration_editor/ExplorationStatesService.js');
require('pages/exploration_editor/ExplorationTagsService.js');
require('pages/exploration_editor/ExplorationTitleService.js');
require('pages/exploration_editor/ExplorationWarningsService.js');
require('pages/exploration_editor/GraphDataService.js');
require('pages/exploration_editor/ParameterMetadataService.js');
require('pages/exploration_editor/RouterService.js');
require('pages/exploration_editor/StateTutorialFirstTimeService.js');
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
require('services/LocalStorageService.js');
require('services/PlaythroughIssuesService.js');
require('services/SiteAnalyticsService.js');
require('services/StateRulesStatsService.js');
require('services/UserService.js');
require('services/UtilsService.js');
require('services/ValidatorsService.js');
require('services/contextual/UrlService.js');
require('services/contextual/WindowDimensionsService.js');
require('services/stateful/FocusManagerService.js');


oppia.factory('ExplorationPropertyService', [
  '$log', '$rootScope', 'AlertsService', 'ChangeListService',
  function($log, $rootScope, AlertsService, ChangeListService) {
    // Public base API for data services corresponding to exploration properties
    // (title, category, etc.)

    var BACKEND_CONVERSIONS = {
      param_changes: function(paramChanges) {
        return paramChanges.map(function(paramChange) {
          return paramChange.toBackendDict();
        });
      },
      param_specs: function(paramSpecs) {
        return paramSpecs.toBackendDict();
      },
    };

    return {
      init: function(value) {
        if (this.propertyName === null) {
          throw 'Exploration property name cannot be null.';
        }

        $log.info('Initializing exploration ' + this.propertyName + ':', value);

        // The current value of the property (which may not have been saved to
        // the frontend yet). In general, this will be bound directly to the UI.
        this.displayed = angular.copy(value);
        // The previous (saved-in-the-frontend) value of the property. Here,
        // 'saved' means that this is the latest value of the property as
        // determined by the frontend change list.
        this.savedMemento = angular.copy(value);

        $rootScope.$broadcast('explorationPropertyChanged');
      },
      // Returns whether the current value has changed from the memento.
      hasChanged: function() {
        return !angular.equals(this.savedMemento, this.displayed);
      },
      // The backend name for this property. THIS MUST BE SPECIFIED BY
      // SUBCLASSES.
      propertyName: null,
      // Transforms the given value into a normalized form. THIS CAN BE
      // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
      _normalize: function(value) {
        return value;
      },
      // Validates the given value and returns a boolean stating whether it
      // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
      // behavior is to always return true.
      _isValid: function(value) {
        return true;
      },
      // Normalizes the displayed value. Then, if the memento and the displayed
      // value are the same, does nothing. Otherwise, creates a new entry in the
      // change list, and updates the memento to the displayed value.
      saveDisplayedValue: function() {
        if (this.propertyName === null) {
          throw 'Exploration property name cannot be null.';
        }

        this.displayed = this._normalize(this.displayed);

        if (!this._isValid(this.displayed) || !this.hasChanged()) {
          this.restoreFromMemento();
          return;
        }

        if (angular.equals(this.displayed, this.savedMemento)) {
          return;
        }

        AlertsService.clearWarnings();

        var newBackendValue = angular.copy(this.displayed);
        var oldBackendValue = angular.copy(this.savedMemento);

        if (BACKEND_CONVERSIONS.hasOwnProperty(this.propertyName)) {
          newBackendValue =
            BACKEND_CONVERSIONS[this.propertyName](this.displayed);
          oldBackendValue =
            BACKEND_CONVERSIONS[this.propertyName](this.savedMemento);
        }

        ChangeListService.editExplorationProperty(
          this.propertyName, newBackendValue, oldBackendValue);
        this.savedMemento = angular.copy(this.displayed);

        $rootScope.$broadcast('explorationPropertyChanged');
      },
      // Reverts the displayed value to the saved memento.
      restoreFromMemento: function() {
        this.displayed = angular.copy(this.savedMemento);
      }
    };
  }
]);
