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

require('components/on-screen-keyboard/on-screen-keyboard.component.ts');
require(
  'components/version-diff-visualization/' +
  'version-diff-visualization.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.component.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.component.ts');
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
  'pages/exploration-editor-page/statistics-tab/statistics-tab.component.ts');
require(
  'pages/exploration-editor-page/translation-tab/translation-tab.component.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'conversation-skin.component.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'exploration-footer.component.ts');
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
require('services/site-analytics.service.ts');
require('services/state-top-answers-stats-backend-api.service.ts');
require('services/state-top-answers-stats.service.ts');
require('services/prevent-page-unload-event.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/bottom-navbar-status.service.ts');
require('services/internet-connectivity.service.ts');
require('services/alerts.service.ts');
require('services/user.service.ts');
require('services/ngb-modal.service.ts');

require('components/on-screen-keyboard/on-screen-keyboard.component');
import { Subscription } from 'rxjs';
import { WelcomeModalComponent } from './modal-templates/welcome-modal.component';
import { HelpModalComponent } from './modal-templates/help-modal.component';

angular.module('oppia').component('explorationEditorPage', {
  template: require('./exploration-editor-page.component.html'),
  controller: [
    '$location', '$q', '$rootScope', '$scope', 'AlertsService',
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
    'FocusManagerService', 'GraphDataService', 'InternetConnectivityService',
    'LoaderService', 'NgbModal',
    'PageTitleService', 'ParamChangesObjectFactory',
    'ParamSpecsObjectFactory', 'PreventPageUnloadEventService',
    'RouterService', 'SiteAnalyticsService',
    'StateClassifierMappingService',
    'StateEditorRefreshService', 'StateEditorService',
    'StateTutorialFirstTimeService',
    'ThreadDataBackendApiService',
    'UserEmailPreferencesService', 'UserExplorationPermissionsService',
    'UserService', 'WindowDimensionsService',
    function(
        $location, $q, $rootScope, $scope, AlertsService,
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
        FocusManagerService, GraphDataService, InternetConnectivityService,
        LoaderService, NgbModal, PageTitleService, ParamChangesObjectFactory,
        ParamSpecsObjectFactory, PreventPageUnloadEventService,
        RouterService, SiteAnalyticsService,
        StateClassifierMappingService,
        StateEditorRefreshService, StateEditorService,
        StateTutorialFirstTimeService,
        ThreadDataBackendApiService,
        UserEmailPreferencesService, UserExplorationPermissionsService,
        UserService, WindowDimensionsService) {
      var ctrl = this;
      var reconnectedMessageTimeoutMilliseconds = 4000;
      var disconnectedMessageTimeoutMilliseconds = 5000;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.autosaveIsInProgress = false;
      ctrl.connectedToInternet = true;
      ctrl.explorationEditorPageHasInitialized = false;

      // When the URL path changes, reroute to the appropriate tab in the
      // Exploration editor page if back and forward button pressed in browser.
      $rootScope.$watch(() => $location.path(), (newPath, oldPath) => {
        if (newPath !== '') {
          RouterService._changeTab(newPath);
          $rootScope.$applyAsync();
        }
      });

      var setDocumentTitle = function() {
        if (ExplorationTitleService.savedMemento) {
          PageTitleService.setDocumentTitle(
            ExplorationTitleService.savedMemento + ' - Oppia Editor');
        } else {
          PageTitleService.setDocumentTitle(
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
        EditabilityService.lockExploration(true);
        return $q.all([
          ExplorationDataService.getDataAsync((explorationId, lostChanges) => {
            if (!AutosaveInfoModalsService.isModalOpen()) {
              AutosaveInfoModalsService.showLostChangesModal(
                lostChanges, explorationId);
              $rootScope.$applyAsync();
            }
          }),
          ExplorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
            ContextService.getExplorationId()),
          ThreadDataBackendApiService.getFeedbackThreadsAsync(),
          UserService.getUserInfoAsync()
        ]).then(async(
            [explorationData, featuresData, _, userInfo]) => {
          if (explorationData.exploration_is_linked_to_story) {
            ctrl.explorationIsLinkedToStory = true;
            ContextService.setExplorationIsLinkedToStory();
          }

          ExplorationFeaturesService.init(explorationData, featuresData);

          StateClassifierMappingService.init(
            ContextService.getExplorationId(), explorationData.version);
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
          if (explorationData.edits_allowed) {
            EditabilityService.lockExploration(false);
          }


          ctrl.explorationTitleService = ExplorationTitleService;
          ctrl.explorationCategoryService = ExplorationCategoryService;
          ctrl.explorationObjectiveService = ExplorationObjectiveService;
          ctrl.ExplorationRightsService = ExplorationRightsService;
          ctrl.explorationInitStateNameService = (
            ExplorationInitStateNameService);

          ctrl.currentUserIsCurriculumAdmin = userInfo.isCurriculumAdmin();
          ctrl.currentUserIsModerator = userInfo.isModerator();

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
            if (ThreadDataBackendApiService.getOpenThreadsCount() > 0) {
              RouterService.navigateToFeedbackTab();
            } else {
              RouterService.navigateToMainTab();
            }
          }

          // Initialize changeList by draft changes if they exist.
          if (explorationData.draft_changes !== null) {
            ChangeListService.loadAutosavedChangeList(
              explorationData.draft_changes);
            $rootScope.$applyAsync();
          }

          if (explorationData.is_version_of_draft_valid === false &&
              explorationData.draft_changes !== null &&
              explorationData.draft_changes.length > 0) {
            // Show modal displaying lost changes if the version of draft
            // changes is invalid, and draft_changes is not `null`.
            AutosaveInfoModalsService.showVersionMismatchModal(
              ChangeListService.getChangeList());
            $rootScope.$applyAsync();
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

          // TODO(#13352): Initialize StateTopAnswersStatsService and register
          // relevant callbacks.

          await ExplorationImprovementsService.initAsync();
          await ExplorationImprovementsService.flushUpdatedTasksToBackend();

          ExplorationWarningsService.updateWarnings();
          StateEditorRefreshService.onRefreshStateEditor.emit();
          ctrl.explorationEditorPageHasInitialized = true;
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
        NgbModal.open(WelcomeModalComponent, {
          backdrop: true,
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
      ctrl.selectMainTab = () => {
        RouterService.navigateToMainTab();
        $rootScope.$applyAsync();
      };
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
        NgbModal.open(HelpModalComponent, {
          backdrop: true,
          windowClass: 'oppia-help-modal'
        }).result.then(mode => {
          if (mode === EDITOR_TUTORIAL_MODE) {
            StateTutorialFirstTimeService.onOpenEditorTutorial.emit();
          } else if (mode === TRANSLATION_TUTORIAL_MODE) {
            StateTutorialFirstTimeService.onOpenTranslationTutorial.emit();
          }
          $rootScope.$applyAsync();
        }, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      ctrl.$onInit = function() {
        InternetConnectivityService.startCheckingConnection();
        ctrl.directiveSubscriptions.add(
          ExplorationPropertyService.onExplorationPropertyChanged.subscribe(
            () => {
              setDocumentTitle();
              $rootScope.$applyAsync();
            }
          )
        );
        ctrl.directiveSubscriptions.add(
          InternetConnectivityService.onInternetStateChange.subscribe(
            internetAccessible => {
              ctrl.connectedToInternet = internetAccessible;
              if (internetAccessible) {
                AlertsService.addSuccessMessage(
                  'Reconnected. Checking whether your changes are mergeable.',
                  reconnectedMessageTimeoutMilliseconds);
                PreventPageUnloadEventService.removeListener();
              } else {
                AlertsService.addInfoMessage(
                  'Looks like you are offline. ' +
                  'You can continue working, and can save ' +
                  'your changes once reconnected.',
                  disconnectedMessageTimeoutMilliseconds);
                PreventPageUnloadEventService.addListener();
                if (RouterService.getActiveTabName() !== 'main') {
                  ctrl.selectMainTab();
                }
              }
            })
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
          RouterService.onRefreshTranslationTab.subscribe(() => {
            $scope.$applyAsync();
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
        ctrl.checkRevertExplorationValidUrl = (
          '/createhandler/check_revert_valid/' + ctrl.explorationId);
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
