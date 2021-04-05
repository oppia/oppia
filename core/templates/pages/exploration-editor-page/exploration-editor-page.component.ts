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
 * @fileoverview Component for the exploration editor page and the editor
 *               help tab in the navbar.
 */

import { State } from 'domain/state/StateObjectFactory';

require('components/on-screen-keyboard/on-screen-keyboard.component.ts');
require(
  'components/version-diff-visualization/' +
  'version-diff-visualization.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.component.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'pages/exploration-editor-page/editor-navigation/' +
  'editor-navbar-breadcrumb.component.ts');
require(
  'pages/exploration-editor-page/editor-navigation/' +
  'editor-navigation.component.ts');
require(
  'pages/exploration-editor-page/exploration-objective-editor/' +
  'exploration-objective-editor.component.ts');
require(
  'pages/exploration-editor-page/exploration-save-and-publish-buttons/' +
  'exploration-save-and-publish-buttons.component.ts');
require(
  'pages/exploration-editor-page/exploration-title-editor/' +
  'exploration-title-editor.component.ts');
require(
  'pages/exploration-editor-page/modal-templates/welcome-modal.controller.ts');
require(
  'pages/exploration-editor-page/param-changes-editor/' +
  'param-changes-editor.component.ts');
require(
  'pages/exploration-editor-page/editor-tab/' +
  'exploration-editor-tab.component.ts');
require('pages/exploration-editor-page/feedback-tab/feedback-tab.component.ts');
require('pages/exploration-editor-page/history-tab/history-tab.component.ts');
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'improvements-tab.component.ts');
require('pages/exploration-editor-page/preview-tab/preview-tab.component.ts');
require('pages/exploration-editor-page/settings-tab/settings-tab.component.ts');
require(
  'pages/exploration-editor-page/statistics-tab/charts/pie-chart.component.ts');
require(
  'pages/exploration-editor-page/statistics-tab/issues/' +
  'playthrough-issues.component.ts');
require(
  'pages/exploration-editor-page/statistics-tab/statistics-tab.component.ts');
require(
  'pages/exploration-editor-page/translation-tab/translation-tab.component.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'conversation-skin.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'exploration-footer.directive.ts');
require('value_generators/valueGeneratorsRequires.ts');

require('interactions/interactionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('domain/exploration/ParamChangesObjectFactory.ts');
require('domain/exploration/ParamSpecsObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/autosave-info-modals.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-automatic-text-to-speech.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-category.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-correctness-feedback.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-language-code.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-objective.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-param-changes.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-param-specs.service.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-save.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/exploration-tags.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'pages/exploration-editor-page/services/state-editor-refresh.service.ts');
require(
  'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'state-tutorial-first-time.service.ts');
require(
  'pages/exploration-editor-page/services/user-email-preferences.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-data-backend-api.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/exploration-features-backend-api.service.ts');
require('services/exploration-features.service.ts');
require('services/exploration-improvements.service.ts');
require('services/page-title.service.ts');
require('services/playthrough-issues.service.ts');
require('services/site-analytics.service.ts');
require('services/state-top-answers-stats-backend-api.service.ts');
require('services/state-top-answers-stats.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/bottom-navbar-status.service.ts');

require('components/on-screen-keyboard/on-screen-keyboard.component');
import { Subscription } from 'rxjs';

angular.module('oppia').component('explorationEditorPage', {
  template: require('./exploration-editor-page.component.html'),
  controller: [
    '$q', '$rootScope', '$scope', '$uibModal',
    'AutosaveInfoModalsService', 'BottomNavbarStatusService',
    'ChangeListService', 'ContextService',
    'EditabilityService', 'ExplorationAutomaticTextToSpeechService',
    'ExplorationCategoryService', 'ExplorationCorrectnessFeedbackService',
    'ExplorationDataService', 'ExplorationFeaturesBackendApiService',
    'ExplorationFeaturesService', 'ExplorationImprovementsService',
    'ExplorationInitStateNameService', 'ExplorationLanguageCodeService',
    'ExplorationObjectiveService', 'ExplorationParamChangesService',
    'ExplorationParamSpecsService', 'ExplorationPropertyService',
    'ExplorationRightsService', 'ExplorationSaveService',
    'ExplorationStatesService', 'ExplorationTagsService',
    'ExplorationTitleService', 'ExplorationWarningsService',
    'FocusManagerService', 'GraphDataService',
    'LoaderService', 'PageTitleService', 'ParamChangesObjectFactory',
    'ParamSpecsObjectFactory', 'RouterService', 'SiteAnalyticsService',
    'StateEditorRefreshService', 'StateEditorService',
    'StateTopAnswersStatsService', 'StateTutorialFirstTimeService',
    'ThreadDataBackendApiService', 'UrlInterpolationService',
    'UserEmailPreferencesService', 'UserExplorationPermissionsService',
    'WindowDimensionsService',
    function(
        $q, $rootScope, $scope, $uibModal,
        AutosaveInfoModalsService, BottomNavbarStatusService,
        ChangeListService, ContextService,
        EditabilityService, ExplorationAutomaticTextToSpeechService,
        ExplorationCategoryService, ExplorationCorrectnessFeedbackService,
        ExplorationDataService, ExplorationFeaturesBackendApiService,
        ExplorationFeaturesService, ExplorationImprovementsService,
        ExplorationInitStateNameService, ExplorationLanguageCodeService,
        ExplorationObjectiveService, ExplorationParamChangesService,
        ExplorationParamSpecsService, ExplorationPropertyService,
        ExplorationRightsService, ExplorationSaveService,
        ExplorationStatesService, ExplorationTagsService,
        ExplorationTitleService, ExplorationWarningsService,
        FocusManagerService, GraphDataService,
        LoaderService, PageTitleService, ParamChangesObjectFactory,
        ParamSpecsObjectFactory, RouterService, SiteAnalyticsService,
        StateEditorRefreshService, StateEditorService,
        StateTopAnswersStatsService, StateTutorialFirstTimeService,
        ThreadDataBackendApiService, UrlInterpolationService,
        UserEmailPreferencesService, UserExplorationPermissionsService,
        WindowDimensionsService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.autosaveIsInProgress = false;

      var setPageTitle = function() {
        if (ExplorationTitleService.savedMemento) {
          PageTitleService.setPageTitle(
            ExplorationTitleService.savedMemento + ' - Oppia Editor');
        } else {
          PageTitleService.setPageTitle(
            'Untitled Exploration - Oppia Editor');
        }
      };

      /** ******************************************
      * Methods affecting the graph visualization.
      ********************************************/
      ctrl.toggleExplorationWarningVisibility = function() {
        ctrl.areExplorationWarningsVisible = (
          !ctrl.areExplorationWarningsVisible);
      };

      ctrl.getExplorationUrl = function(explorationId) {
        return explorationId ? ('/explore/' + explorationId) : '';
      };

      // Initializes the exploration page using data from the backend.
      // Called on page load.
      ctrl.initExplorationPage = () => {
        return $q.all([
          ExplorationDataService.getData((explorationId, lostChanges) => {
            if (!AutosaveInfoModalsService.isModalOpen()) {
              AutosaveInfoModalsService.showLostChangesModal(
                lostChanges, explorationId);
            }
          }),
          ExplorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
            ContextService.getExplorationId()),
          ThreadDataBackendApiService.getOpenThreadsCountAsync()
        ]).then(async([explorationData, featuresData, openThreadsCount]) => {
          if (explorationData.exploration_is_linked_to_story) {
            ContextService.setExplorationIsLinkedToStory();
          }

          ExplorationFeaturesService.init(explorationData, featuresData);

          ExplorationStatesService.init(explorationData.states);

          ExplorationTitleService.init(explorationData.title);
          ExplorationCategoryService.init(explorationData.category);
          ExplorationObjectiveService.init(explorationData.objective);
          ExplorationLanguageCodeService.init(
            explorationData.language_code);
          ExplorationInitStateNameService.init(
            explorationData.init_state_name);
          ExplorationTagsService.init(explorationData.tags);
          ExplorationParamSpecsService.init(
            ParamSpecsObjectFactory.createFromBackendDict(
              explorationData.param_specs));
          ExplorationParamChangesService.init(
            ParamChangesObjectFactory.createFromBackendList(
              explorationData.param_changes));
          ExplorationAutomaticTextToSpeechService.init(
            explorationData.auto_tts_enabled);
          ExplorationCorrectnessFeedbackService.init(
            explorationData.correctness_feedback_enabled);

          ctrl.explorationTitleService = ExplorationTitleService;
          ctrl.explorationCategoryService = ExplorationCategoryService;
          ctrl.explorationObjectiveService = ExplorationObjectiveService;
          ctrl.ExplorationRightsService = ExplorationRightsService;
          ctrl.explorationInitStateNameService = (
            ExplorationInitStateNameService);

          ctrl.currentUserIsAdmin = explorationData.is_admin;
          ctrl.currentUserIsModerator = explorationData.is_moderator;

          ctrl.currentUser = explorationData.user;
          ctrl.currentVersion = explorationData.version;

          ExplorationRightsService.init(
            explorationData.rights.owner_names,
            explorationData.rights.editor_names,
            explorationData.rights.voice_artist_names,
            explorationData.rights.viewer_names,
            explorationData.rights.status,
            explorationData.rights.cloned_from,
            explorationData.rights.community_owned,
            explorationData.rights.viewable_if_private);
          UserEmailPreferencesService.init(
            explorationData.email_preferences.mute_feedback_notifications,
            explorationData.email_preferences
              .mute_suggestion_notifications);

          UserExplorationPermissionsService.getPermissionsAsync()
            .then(permissions => {
              if (permissions.canEdit) {
                EditabilityService.markEditable();
              }
              if (permissions.canVoiceover || permissions.canEdit) {
                EditabilityService.markTranslatable();
              }
            });

          StateEditorService.updateExplorationWhitelistedStatus(
            featuresData.isExplorationWhitelisted);

          GraphDataService.recompute();

          if (!StateEditorService.getActiveStateName() ||
              !ExplorationStatesService.getState(
                StateEditorService.getActiveStateName())) {
            StateEditorService.setActiveStateName(
              ExplorationInitStateNameService.displayed);
          }

          if (!RouterService.isLocationSetToNonStateEditorTab() &&
              !explorationData.states.hasOwnProperty(
                RouterService.getCurrentStateFromLocationPath('gui'))) {
            if (openThreadsCount > 0) {
              RouterService.navigateToFeedbackTab();
            } else {
              RouterService.navigateToMainTab();
            }
          }

          // Initialize changeList by draft changes if they exist.
          if (explorationData.draft_changes !== null) {
            ChangeListService.loadAutosavedChangeList(
              explorationData.draft_changes);
          }

          if (explorationData.is_version_of_draft_valid === false &&
              explorationData.draft_changes !== null &&
              explorationData.draft_changes.length > 0) {
            // Show modal displaying lost changes if the version of draft
            // changes is invalid, and draft_changes is not `null`.
            AutosaveInfoModalsService.showVersionMismatchModal(
              ChangeListService.getChangeList());
            return;
          }
          RouterService.onRefreshStatisticsTab.emit();

          RouterService.onRefreshVersionHistory.emit({
            forceRefresh: true
          });

          if (ExplorationStatesService.getState(
            StateEditorService.getActiveStateName())) {
            StateEditorRefreshService.onRefreshStateEditor.emit();
          }

          StateTutorialFirstTimeService.initEditor(
            explorationData.show_state_editor_tutorial_on_load,
            ctrl.explorationId);

          if (explorationData.show_state_translation_tutorial_on_load) {
            StateTutorialFirstTimeService
              .markTranslationTutorialNotSeenBefore();
          }

          // Statistics and the improvement tasks derived from them are only
          // relevant when an exploration is published and is being played by
          // learners.
          if (ExplorationRightsService.isPublic()) {
            await StateTopAnswersStatsService.initAsync(
              ctrl.explorationId, ExplorationStatesService.getStates());

            ExplorationStatesService.registerOnStateAddedCallback(
              (stateName: string) => {
                StateTopAnswersStatsService.onStateAdded(stateName);
              });
            ExplorationStatesService.registerOnStateDeletedCallback(
              (stateName: string) => {
                StateTopAnswersStatsService.onStateDeleted(stateName);
              });
            ExplorationStatesService.registerOnStateRenamedCallback(
              (oldName: string, newName: string) => {
                StateTopAnswersStatsService.onStateRenamed(oldName, newName);
              });
            ExplorationStatesService.registerOnStateInteractionSavedCallback(
              (state: State) => {
                StateTopAnswersStatsService.onStateInteractionSaved(state);
              });
          }

          await ExplorationImprovementsService.initAsync();
          await ExplorationImprovementsService.flushUpdatedTasksToBackend();

          ExplorationWarningsService.updateWarnings();
          StateEditorRefreshService.onRefreshStateEditor.emit();
          $scope.$applyAsync();
        });
      };

      ctrl.getActiveTabName = function() {
        return RouterService.getActiveTabName();
      };

      ctrl.setFocusOnActiveTab = function(activeTab) {
        if (activeTab === 'history') {
          FocusManagerService.setFocus('usernameInputField');
        }
        if (activeTab === 'feedback') {
          if (!ctrl.activeThread) {
            FocusManagerService.setFocus('newThreadButton');
          }
          if (ctrl.activeThread) {
            FocusManagerService.setFocus('tmpMessageText');
          }
        }
      };

      ctrl.startEditorTutorial = function() {
        EditabilityService.onStartTutorial();
        if (RouterService.getActiveTabName() !== 'main') {
          ctrl.selectMainTab();
        } else {
          StateEditorRefreshService.onRefreshStateEditor.emit();
        }
      };

      ctrl.startTranslationTutorial = function() {
        EditabilityService.onStartTutorial();
        if (RouterService.getActiveTabName() !== 'translation') {
          ctrl.selectTranslationTab();
        } else {
          RouterService.onRefreshTranslationTab.emit();
        }
      };

      ctrl.showWelcomeExplorationModal = function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/modal-templates/' +
            'welcome-modal.template.html'),
          backdrop: true,
          controller: 'WelcomeModalController',
          windowClass: 'oppia-welcome-modal'
        }).result.then(function(explorationId) {
          SiteAnalyticsService.registerAcceptTutorialModalEvent(
            explorationId);
          ctrl.startEditorTutorial();
        }, function(explorationId) {
          SiteAnalyticsService.registerDeclineTutorialModalEvent(
            explorationId);
          StateTutorialFirstTimeService.markEditorTutorialFinished();
        });
      };

      ctrl.getNavbarText = function() {
        return 'Exploration Editor';
      };

      ctrl.countWarnings = () => ExplorationWarningsService.countWarnings();
      ctrl.getWarnings = () => ExplorationWarningsService.getWarnings();
      ctrl.hasCriticalWarnings = () => (
        ExplorationWarningsService.hasCriticalWarnings);
      ctrl.selectMainTab = () => RouterService.navigateToMainTab();
      ctrl.selectTranslationTab = (
        () => RouterService.navigateToTranslationTab());
      ctrl.selectPreviewTab = () => RouterService.navigateToPreviewTab();
      ctrl.selectSettingsTab = () => RouterService.navigateToSettingsTab();
      ctrl.selectStatsTab = () => RouterService.navigateToStatsTab();
      ctrl.selectImprovementsTab = (
        () => RouterService.navigateToImprovementsTab());
      ctrl.selectHistoryTab = () => {
        RouterService.navigateToHistoryTab();
        ctrl.setFocusOnActiveTab('history');
      };
      ctrl.selectFeedbackTab = () => {
        RouterService.navigateToFeedbackTab();
        ctrl.setFocusOnActiveTab('feedback');
      };
      ctrl.getOpenThreadsCount = (
        () => ThreadDataBackendApiService.getOpenThreadsCount());
      ctrl.showUserHelpModal = () => {
        var explorationId = ContextService.getExplorationId();
        SiteAnalyticsService.registerClickHelpButtonEvent(explorationId);
        var EDITOR_TUTORIAL_MODE = 'editor';
        var TRANSLATION_TUTORIAL_MODE = 'translation';
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/modal-templates/' +
              'help-modal.template.html'),
          backdrop: true,
          controller: 'HelpModalController',
          windowClass: 'oppia-help-modal'
        }).result.then(mode => {
          if (mode === EDITOR_TUTORIAL_MODE) {
            StateTutorialFirstTimeService.onOpenEditorTutorial.emit();
          } else if (mode === TRANSLATION_TUTORIAL_MODE) {
            StateTutorialFirstTimeService.onOpenTranslationTutorial.emit();
          }
        }, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          ExplorationPropertyService.onExplorationPropertyChanged.subscribe(
            () => {
              setPageTitle();
            }
          )
        );
        ctrl.directiveSubscriptions.add(
          ChangeListService.autosaveIsInProgress$.subscribe(
            autosaveIsInProgress => {
              ctrl.autosaveIsInProgress = autosaveIsInProgress;
              $rootScope.$applyAsync();
            }
          )
        );
        ctrl.screenIsLarge = WindowDimensionsService.getWidth() >= 1024;
        BottomNavbarStatusService.markBottomNavbarStatus(true);

        ctrl.directiveSubscriptions.add(
          ExplorationSaveService.onInitExplorationPage.subscribe(
            (successCallback) => {
              ctrl.initExplorationPage().then(successCallback);
            }
          )
        );
        ctrl.directiveSubscriptions.add(
          ExplorationStatesService.onRefreshGraph.subscribe(() => {
            GraphDataService.recompute();
            ExplorationWarningsService.updateWarnings();
          }));
        ctrl.directiveSubscriptions.add(
          // eslint-disable-next-line max-len
          StateTutorialFirstTimeService.onEnterEditorForTheFirstTime.subscribe(() => {
            ctrl.showWelcomeExplorationModal();
          })
        );
        ctrl.directiveSubscriptions.add(
          StateTutorialFirstTimeService.onOpenEditorTutorial.subscribe(
            () => {
              ctrl.startEditorTutorial();
            })
        );
        ctrl.directiveSubscriptions.add(
          StateTutorialFirstTimeService.onOpenTranslationTutorial.subscribe(
            () => {
              ctrl.startTranslationTutorial();
            })
        );
        ctrl.EditabilityService = EditabilityService;
        ctrl.StateEditorService = StateEditorService;

        /** ********************************************************
         * Called on initial load of the exploration editor page.
         *********************************************************/
        LoaderService.showLoadingScreen('Loading');

        ctrl.explorationId = ContextService.getExplorationId();
        ctrl.explorationUrl = '/create/' + ctrl.explorationId;
        ctrl.explorationDownloadUrl = (
          '/createhandler/download/' + ctrl.explorationId);
        ctrl.revertExplorationUrl = (
          '/createhandler/revert/' + ctrl.explorationId);
        ctrl.areExplorationWarningsVisible = false;
        // The initExplorationPage function is written separately since it
        // is also called in $scope.$on when some external events are
        // triggered.
        ctrl.initExplorationPage();

        let improvementsTabIsEnabled = false;
        $q.when(ExplorationImprovementsService.isImprovementsTabEnabledAsync())
          .then(improvementsTabIsEnabledResponse => {
            improvementsTabIsEnabled = improvementsTabIsEnabledResponse;
          });
        ctrl.isImprovementsTabEnabled = () => improvementsTabIsEnabled;
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
