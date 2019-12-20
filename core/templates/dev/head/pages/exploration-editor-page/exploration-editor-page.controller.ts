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
 * @fileoverview Controllers for the exploration editor page and the editor
 *               help tab in the navbar.
 */

require(
  'components/version-diff-visualization/' +
  'version-diff-visualization.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('components/profile-link-directives/profile-link-text.directive.ts');
require(
  'pages/exploration-editor-page/editor-navigation/' +
  'editor-navbar-breadcrumb.directive.ts');
require(
  'pages/exploration-editor-page/editor-navigation/' +
  'editor-navigation.directive.ts');
require(
  'pages/exploration-editor-page/exploration-objective-editor/' +
  'exploration-objective-editor.directive.ts');
require(
  'pages/exploration-editor-page/exploration-save-and-publish-buttons/' +
  'exploration-save-and-publish-buttons.directive.ts');
require(
  'pages/exploration-editor-page/exploration-title-editor/' +
  'exploration-title-editor.directive.ts');
require(
  'pages/exploration-editor-page/param-changes-editor/' +
  'param-changes-editor.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/' +
  'exploration-editor-tab.directive.ts');
require('pages/exploration-editor-page/feedback-tab/feedback-tab.directive.ts');
require(
  'pages/exploration-editor-page/feedback-tab/thread-table/' +
  'thread-table.directive.ts');
require('pages/exploration-editor-page/history-tab/history-tab.directive.ts');
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'improvements-tab.directive.ts');
require('pages/exploration-editor-page/preview-tab/preview-tab.directive.ts');
require('pages/exploration-editor-page/settings-tab/settings-tab.directive.ts');
require(
  'pages/exploration-editor-page/statistics-tab/charts/bar-chart.directive.ts');
require(
  'pages/exploration-editor-page/statistics-tab/charts/pie-chart.directive.ts');
require(
  'pages/exploration-editor-page/statistics-tab/issues/' +
  'playthrough-issues.directive.ts');
require(
  'pages/exploration-editor-page/statistics-tab/statistics-tab.directive.ts');
require(
  'pages/exploration-editor-page/translation-tab/translation-tab.directive.ts');
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
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/exploration-tags.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
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
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/exploration-features-backend-api.service.ts');
require('services/exploration-features.service.ts');
require('services/page-title.service.ts');
require('services/playthrough-issues.service.ts');
require('services/site-analytics.service.ts');
require('services/state-top-answers-stats-backend-api.service.ts');
require('services/state-top-answers-stats.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('explorationEditorPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/' +
        'exploration-editor-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$log', '$q', '$rootScope', '$scope', '$templateCache',
        '$timeout', '$uibModal', '$window', 'AutosaveInfoModalsService',
        'ChangeListService', 'ContextService', 'EditabilityService',
        'ExplorationAutomaticTextToSpeechService', 'ExplorationCategoryService',
        'ExplorationCorrectnessFeedbackService', 'ExplorationDataService',
        'ExplorationFeaturesBackendApiService', 'ExplorationFeaturesService',
        'ExplorationInitStateNameService', 'ExplorationLanguageCodeService',
        'ExplorationObjectiveService', 'ExplorationParamChangesService',
        'ExplorationParamSpecsService', 'ExplorationRightsService',
        'ExplorationStatesService', 'ExplorationTagsService',
        'ExplorationTitleService', 'ExplorationWarningsService',
        'GraphDataService', 'PageTitleService', 'ParamChangesObjectFactory',
        'ParamSpecsObjectFactory', 'PlaythroughIssuesService', 'RouterService',
        'SiteAnalyticsService', 'StateClassifierMappingService',
        'StateEditorService', 'StateTopAnswersStatsBackendApiService',
        'StateTopAnswersStatsService', 'StateTutorialFirstTimeService',
        'ThreadDataService', 'UrlInterpolationService',
        'UserEmailPreferencesService', 'UserExplorationPermissionsService',
        'EVENT_EXPLORATION_PROPERTY_CHANGED',
        function(
            $http, $log, $q, $rootScope, $scope, $templateCache,
            $timeout, $uibModal, $window, AutosaveInfoModalsService,
            ChangeListService, ContextService, EditabilityService,
            ExplorationAutomaticTextToSpeechService, ExplorationCategoryService,
            ExplorationCorrectnessFeedbackService, ExplorationDataService,
            ExplorationFeaturesBackendApiService, ExplorationFeaturesService,
            ExplorationInitStateNameService, ExplorationLanguageCodeService,
            ExplorationObjectiveService, ExplorationParamChangesService,
            ExplorationParamSpecsService, ExplorationRightsService,
            ExplorationStatesService, ExplorationTagsService,
            ExplorationTitleService, ExplorationWarningsService,
            GraphDataService, PageTitleService, ParamChangesObjectFactory,
            ParamSpecsObjectFactory, PlaythroughIssuesService, RouterService,
            SiteAnalyticsService, StateClassifierMappingService,
            StateEditorService, StateTopAnswersStatsBackendApiService,
            StateTopAnswersStatsService, StateTutorialFirstTimeService,
            ThreadDataService, UrlInterpolationService,
            UserEmailPreferencesService, UserExplorationPermissionsService,
            EVENT_EXPLORATION_PROPERTY_CHANGED) {
          var ctrl = this;
          ctrl.EditabilityService = EditabilityService;
          ctrl.StateEditorService = StateEditorService;

          /** ********************************************************
           * Called on initial load of the exploration editor page.
           *********************************************************/
          $rootScope.loadingMessage = 'Loading';

          ctrl.explorationId = ContextService.getExplorationId();
          ctrl.explorationUrl = '/create/' + ctrl.explorationId;
          ctrl.explorationDownloadUrl = (
            '/createhandler/download/' + ctrl.explorationId);
          ctrl.revertExplorationUrl = (
            '/createhandler/revert/' + ctrl.explorationId);

          var setPageTitle = function() {
            if (ExplorationTitleService.savedMemento) {
              PageTitleService.setPageTitle(
                ExplorationTitleService.savedMemento + ' - Oppia Editor');
            } else {
              PageTitleService.setPageTitle(
                'Untitled Exploration - Oppia Editor');
            }
          };

          $scope.$on(EVENT_EXPLORATION_PROPERTY_CHANGED, setPageTitle);

          ctrl.getActiveTabName = RouterService.getActiveTabName;

          /** ******************************************
          * Methods affecting the graph visualization.
          ********************************************/
          ctrl.areExplorationWarningsVisible = false;
          ctrl.toggleExplorationWarningVisibility = function() {
            ctrl.areExplorationWarningsVisible = (
              !ctrl.areExplorationWarningsVisible);
          };

          $scope.$on('refreshGraph', function() {
            GraphDataService.recompute();
            ExplorationWarningsService.updateWarnings();
          });

          ctrl.getExplorationUrl = function(explorationId) {
            return explorationId ? ('/explore/' + explorationId) : '';
          };

          // Initializes the exploration page using data from the backend.
          // Called on page load.
          ctrl.initExplorationPage = function(successCallback) {
            $q.all([
              ExplorationDataService.getData(function(
                  explorationId, lostChanges) {
                if (!AutosaveInfoModalsService.isModalOpen()) {
                  AutosaveInfoModalsService.showLostChangesModal(
                    lostChanges, explorationId);
                }
              }),
              ExplorationFeaturesBackendApiService.fetchExplorationFeatures(
                ContextService.getExplorationId()),
            ]).then(function(combinedData) {
              var explorationData = combinedData[0];
              var featuresData = combinedData[1];

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
              StateClassifierMappingService.init(
                explorationData.state_classifier_mapping);
              PlaythroughIssuesService.initSession(
                explorationData.exploration_id, explorationData.version);

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
                .then(function(permissions) {
                  if (permissions.can_edit) {
                    EditabilityService.markEditable();
                  }
                  if (permissions.can_voiceover || permissions.can_edit) {
                    EditabilityService.markTranslatable();
                  }
                });

              StateEditorService.updateExplorationWhitelistedStatus(
                featuresData.is_exploration_whitelisted);

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
                if (ThreadDataService.getOpenThreadsCount() > 0) {
                  RouterService.navigateToFeedbackTab();
                } else {
                  RouterService.navigateToMainTab();
                }
              }

              ExplorationWarningsService.updateWarnings();

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

              $scope.$broadcast('refreshStatisticsTab');
              $scope.$broadcast('refreshVersionHistory', {
                forceRefresh: true
              });

              if (ExplorationStatesService.getState(
                StateEditorService.getActiveStateName())) {
                $scope.$broadcast('refreshStateEditor');
              }

              if (successCallback) {
                successCallback();
              }

              StateTutorialFirstTimeService.initEditor(
                explorationData.show_state_editor_tutorial_on_load,
                ctrl.explorationId);

              if (explorationData.show_state_translation_tutorial_on_load) {
                StateTutorialFirstTimeService
                  .markTranslationTutorialNotSeenBefore();
              }

              if (ExplorationRightsService.isPublic()) {
                // Stats are loaded asynchronously after the exploration data
                // because they are not needed to interact with the editor.
                StateTopAnswersStatsBackendApiService.fetchStats(
                  ctrl.explorationId
                ).then(StateTopAnswersStatsService.init).then(function() {
                  ExplorationWarningsService.updateWarnings();
                  $scope.$broadcast('refreshStateEditor');
                });
              }
            });
          };

          ctrl.initExplorationPage();

          $scope.$on('initExplorationPage', function(
              unusedEvtData, successCallback) {
            ctrl.initExplorationPage(successCallback);
          });

          var _ID_TUTORIAL_STATE_CONTENT = '#tutorialStateContent';
          var _ID_TUTORIAL_STATE_INTERACTION = '#tutorialStateInteraction';
          var _ID_TUTORIAL_PREVIEW_TAB = '#tutorialPreviewTab';
          var _ID_TUTORIAL_SAVE_BUTTON = '#tutorialSaveButton';

          var saveButtonTutorialElement = {
            type: 'element',
            selector: _ID_TUTORIAL_SAVE_BUTTON,
            heading: 'Save',
            text: (
              'When you\'re done making changes, ' +
              'be sure to save your work.<br><br>'),
            placement: 'bottom'
          };

          ctrl.EDITOR_TUTORIAL_OPTIONS = [{
            type: 'title',
            heading: 'Creating in Oppia',
            text: (
              'Explorations are learning experiences that you create using ' +
              'Oppia. Think of explorations as a conversation between a ' +
              'student and a tutor.')
          }, {
            type: 'function',
            fn: function(isGoingForward) {
              $('html, body').animate({
                scrollTop: (isGoingForward ? 0 : 20)
              }, 1000);
            }
          }, {
            type: 'element',
            selector: _ID_TUTORIAL_STATE_CONTENT,
            heading: 'Content',
            text: (
              '<p>An Oppia exploration is divided into several \'cards\'. ' +
              'The first part of a card is the <b>content</b>.</p>' +
              '<p>Use the content section to set the scene. ' +
              'Tell the learner a story, give them some information, ' +
              'and then ask a relevant question.</p>'),
            placement: 'bottom'
          }, {
            type: 'function',
            fn: function(isGoingForward) {
              var idToScrollTo = (
                isGoingForward ? _ID_TUTORIAL_STATE_INTERACTION :
                _ID_TUTORIAL_STATE_CONTENT);
              $('html, body').animate({
                scrollTop: angular.element(idToScrollTo).offset().top - 200
              }, 1000);
            }
          }, {
            type: 'title',
            selector: _ID_TUTORIAL_STATE_INTERACTION,
            heading: 'Interaction',
            text: (
              '<p>After you\'ve written the content of your conversation, ' +
              'choose an <b>interaction type</b>. ' +
              'An interaction is how you want your learner to respond ' +
              'to your question.</p> ' +
              '<p>Oppia has several built-in interactions, including:</p>' +
              '<ul>' +
              '  <li>' +
              '    Multiple Choice' +
              '  </li>' +
              '  <li>' +
              '    Text/Number input' +
              '  </li>' +
              '  <li>' +
              '    Code snippets' +
              '  </li>' +
              '</ul>' +
              'and more.')
          }, {
            type: 'function',
            fn: function(isGoingForward) {
              var idToScrollTo = (
                isGoingForward ? _ID_TUTORIAL_PREVIEW_TAB :
                _ID_TUTORIAL_STATE_INTERACTION);
              $('html, body').animate({
                scrollTop: angular.element(idToScrollTo).offset().top - 200
              }, 1000);
            }
          }, {
            type: 'title',
            heading: 'Responses',
            text: (
              'After the learner uses the interaction you created, it\'s ' +
              'your turn again to choose how your exploration will respond ' +
              'to their input. You can send a learner to a new card or have ' +
              'them repeat the same card, depending on how they answer.')
          }, {
            type: 'function',
            fn: function(isGoingForward) {
              var idToScrollTo = (
                isGoingForward ? _ID_TUTORIAL_PREVIEW_TAB :
                _ID_TUTORIAL_STATE_INTERACTION);
              $('html, body').animate({
                scrollTop: angular.element(idToScrollTo).offset().top - 200
              }, 1000);
            }
          }, {
            type: 'element',
            selector: _ID_TUTORIAL_PREVIEW_TAB,
            heading: 'Preview',
            text: (
              'At any time, you can click the <b>preview</b> button to play ' +
              'through your exploration.'),
            placement: 'bottom'
          }, saveButtonTutorialElement, {
            type: 'title',
            heading: 'Tutorial Complete',
            text: (
              '<h2>Now for the fun part...</h2>' +
              'That\'s the end of the tour! ' +
              'To finish up, here are some things we suggest: ' +
              '<ul>' +
              '  <li>' +
              '    Create your first card!' +
              '  </li>' +
              '  <li>' +
              '    Preview your exploration.' +
              '  </li>' +
              '  <li>' +
              '    Check out more resources in the ' +
              '    <a href="https://oppia.github.io/#/" target="_blank">' +
              '      Help Center.' +
              '    </a>' +
              '  </li>' +
              '</ul>')
          }];

          // Remove save from tutorial if user does not has edit rights for
          // exploration since in that case Save Draft button will not be
          // visible on the create page.
          UserExplorationPermissionsService.getPermissionsAsync()
            .then(function(permissions) {
              if (!permissions.can_edit) {
                var index = ctrl.EDITOR_TUTORIAL_OPTIONS.indexOf(
                  saveButtonTutorialElement);
                ctrl.EDITOR_TUTORIAL_OPTIONS.splice(index, 1);
              }
            });

          // Replace the ng-joyride template with one that uses <[...]>
          // interpolators instead of/ {{...}} interpolators.
          var ngJoyrideTemplate = $templateCache.get(
            'ng-joyride-title-tplv1.html');
          ngJoyrideTemplate = ngJoyrideTemplate.replace(
            /\{\{/g, '<[').replace(/\}\}/g, ']>');
          $templateCache.put('ng-joyride-title-tplv1.html', ngJoyrideTemplate);

          var leaveTutorial = function() {
            EditabilityService.onEndTutorial();
            $scope.$apply();
            StateTutorialFirstTimeService.markEditorTutorialFinished();
            ctrl.tutorialInProgress = false;
          };

          ctrl.onSkipTutorial = function() {
            SiteAnalyticsService.registerSkipTutorialEvent(ctrl.explorationId);
            leaveTutorial();
          };

          ctrl.onFinishTutorial = function() {
            SiteAnalyticsService.registerFinishTutorialEvent(
              ctrl.explorationId);
            leaveTutorial();
          };

          ctrl.tutorialInProgress = false;
          ctrl.startTutorial = function() {
            RouterService.navigateToMainTab();
            // The $timeout wrapper is needed for all components on the page to
            // load, otherwise elements within ng-if's are not guaranteed to be
            // present on the page.
            $timeout(function() {
              EditabilityService.onStartTutorial();
              ctrl.tutorialInProgress = true;
            });
          };

          ctrl.isImprovementsTabEnabled = function() {
            return ExplorationFeaturesService.isInitialized() &&
              ExplorationFeaturesService.isImprovementsTabEnabled();
          };

          ctrl.isFeedbackTabEnabled = function() {
            return ExplorationFeaturesService.isInitialized() &&
              !ExplorationFeaturesService.isImprovementsTabEnabled();
          };

          ctrl.showWelcomeExplorationModal = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/modal-templates/' +
                'welcome-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', 'SiteAnalyticsService',
                'ContextService',
                function($scope, $uibModalInstance, SiteAnalyticsService,
                    ContextService) {
                  var explorationId = ContextService.getExplorationId();

                  SiteAnalyticsService.registerTutorialModalOpenEvent(
                    explorationId);

                  $scope.beginTutorial = function() {
                    SiteAnalyticsService.registerAcceptTutorialModalEvent(
                      explorationId);
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    SiteAnalyticsService.registerDeclineTutorialModalEvent(
                      explorationId);
                    $uibModalInstance.dismiss('cancel');
                  };

                  $scope.editorWelcomeImgUrl = (
                    UrlInterpolationService.getStaticImageUrl(
                      '/general/editor_welcome.svg'));
                }
              ],
              windowClass: 'oppia-welcome-modal'
            });

            modalInstance.result.then(function() {
              ctrl.startTutorial();
            }, function() {
              StateTutorialFirstTimeService.markEditorTutorialFinished();
            });
          };

          $scope.$on(
            'enterEditorForTheFirstTime', ctrl.showWelcomeExplorationModal);
          $scope.$on('openEditorTutorial', ctrl.startTutorial);
        }
      ]
    };
  }]);
