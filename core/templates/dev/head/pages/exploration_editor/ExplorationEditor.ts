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

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
oppia.constant(
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  'explorationTitleInputFocusLabel');
oppia.constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>');
oppia.constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>?v=<version>');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>');
oppia.constant(
  'TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/translate/<exploration_id>');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');

oppia.controller('ExplorationEditor', [
  '$http', '$log', '$q', '$rootScope', '$scope', '$templateCache', '$timeout',
  '$uibModal', '$window', 'AutosaveInfoModalsService', 'ChangeListService',
  'ContextService', 'EditabilityService',
  'ExplorationAutomaticTextToSpeechService', 'ExplorationCategoryService',
  'ExplorationCorrectnessFeedbackService', 'ExplorationDataService',
  'ExplorationFeaturesBackendApiService', 'ExplorationFeaturesService',
  'ExplorationInitStateNameService', 'ExplorationLanguageCodeService',
  'ExplorationObjectiveService', 'ExplorationParamChangesService',
  'ExplorationParamSpecsService', 'ExplorationRightsService',
  'ExplorationStatesService', 'ExplorationTagsService',
  'ExplorationTitleService', 'ExplorationWarningsService', 'GraphDataService',
  'ParamChangesObjectFactory', 'ParamSpecsObjectFactory',
  'PlaythroughIssuesService', 'RouterService', 'SiteAnalyticsService',
  'StateClassifierMappingService', 'StateEditorService',
  'StateTopAnswersStatsBackendApiService', 'StateTopAnswersStatsService',
  'StateTutorialFirstTimeService', 'ThreadDataService',
  'UrlInterpolationService', 'UserEmailPreferencesService',
  function(
      $http, $log, $q, $rootScope, $scope, $templateCache, $timeout,
      $uibModal, $window, AutosaveInfoModalsService, ChangeListService,
      ContextService, EditabilityService,
      ExplorationAutomaticTextToSpeechService, ExplorationCategoryService,
      ExplorationCorrectnessFeedbackService, ExplorationDataService,
      ExplorationFeaturesBackendApiService, ExplorationFeaturesService,
      ExplorationInitStateNameService, ExplorationLanguageCodeService,
      ExplorationObjectiveService, ExplorationParamChangesService,
      ExplorationParamSpecsService, ExplorationRightsService,
      ExplorationStatesService, ExplorationTagsService,
      ExplorationTitleService, ExplorationWarningsService, GraphDataService,
      ParamChangesObjectFactory, ParamSpecsObjectFactory,
      PlaythroughIssuesService, RouterService, SiteAnalyticsService,
      StateClassifierMappingService, StateEditorService,
      StateTopAnswersStatsBackendApiService, StateTopAnswersStatsService,
      StateTutorialFirstTimeService, ThreadDataService,
      UrlInterpolationService, UserEmailPreferencesService) {
    $scope.EditabilityService = EditabilityService;
    $scope.StateEditorService = StateEditorService;

    /** ********************************************************
     * Called on initial load of the exploration editor page.
     *********************************************************/
    $rootScope.loadingMessage = 'Loading';

    $scope.explorationId = ContextService.getExplorationId();
    $scope.explorationUrl = '/create/' + $scope.explorationId;
    $scope.explorationDownloadUrl = (
      '/createhandler/download/' + $scope.explorationId);
    $scope.revertExplorationUrl = (
      '/createhandler/revert/' + $scope.explorationId);

    $scope.getActiveTabName = RouterService.getActiveTabName;

    /** ******************************************
    * Methods affecting the graph visualization.
    ********************************************/
    $scope.areExplorationWarningsVisible = false;
    $scope.toggleExplorationWarningVisibility = function() {
      $scope.areExplorationWarningsVisible = (
        !$scope.areExplorationWarningsVisible);
    };

    $scope.$on('refreshGraph', function() {
      GraphDataService.recompute();
      ExplorationWarningsService.updateWarnings();
    });

    $scope.getExplorationUrl = function(explorationId) {
      return explorationId ? ('/explore/' + explorationId) : '';
    };

    // Initializes the exploration page using data from the backend. Called on
    // page load.
    $scope.initExplorationPage = function(successCallback) {
      $q.all([
        ExplorationDataService.getData(function(explorationId, lostChanges) {
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
        ExplorationLanguageCodeService.init(explorationData.language_code);
        ExplorationInitStateNameService.init(explorationData.init_state_name);
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

        $scope.explorationTitleService = ExplorationTitleService;
        $scope.explorationCategoryService = ExplorationCategoryService;
        $scope.explorationObjectiveService = ExplorationObjectiveService;
        $scope.ExplorationRightsService = ExplorationRightsService;
        $scope.explorationInitStateNameService = (
          ExplorationInitStateNameService);

        $scope.currentUserIsAdmin = explorationData.is_admin;
        $scope.currentUserIsModerator = explorationData.is_moderator;

        $scope.currentUser = explorationData.user;
        $scope.currentVersion = explorationData.version;

        ExplorationRightsService.init(
          explorationData.rights.owner_names,
          explorationData.rights.editor_names,
          explorationData.rights.translator_names,
          explorationData.rights.viewer_names, explorationData.rights.status,
          explorationData.rights.cloned_from,
          explorationData.rights.community_owned,
          explorationData.rights.viewable_if_private);
        UserEmailPreferencesService.init(
          explorationData.email_preferences.mute_feedback_notifications,
          explorationData.email_preferences.mute_suggestion_notifications);

        if (GLOBALS.can_edit) {
          EditabilityService.markEditable();
        }

        if (GLOBALS.can_translate || GLOBALS.can_edit) {
          EditabilityService.markTranslatable();
        }

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
          $scope.explorationId);

        if (ExplorationRightsService.isPublic()) {
          // Stats are loaded asynchronously after the exploration data because
          // they are not needed to interact with the editor.
          StateTopAnswersStatsBackendApiService.fetchStats(
            $scope.explorationId
          ).then(StateTopAnswersStatsService.init).then(function() {
            ExplorationWarningsService.updateWarnings();
            $scope.$broadcast('refreshStateEditor');
          });
        }
      });
    };

    $scope.initExplorationPage();

    $scope.$on('initExplorationPage', function(unusedEvtData, successCallback) {
      $scope.initExplorationPage(successCallback);
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

    $scope.EDITOR_TUTORIAL_OPTIONS = [{
      type: 'title',
      heading: 'Creating in Oppia',
      text: (
        'Explorations are learning experiences that you create using Oppia. ' +
        'Think of explorations as a conversation between a student ' +
        'and a tutor.')
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
        'After the learner uses the interaction you created, it\'s your turn ' +
        'again to choose how your exploration will respond to their input. ' +
        'You can send a learner to a new card or have them repeat the same ' +
        'card, depending on how they answer.')
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
    // exploration since in that case Save Draft button will not be visible
    // on the create page.
    if (!GLOBALS.can_edit) {
      var index = $scope.EDITOR_TUTORIAL_OPTIONS.indexOf(
        saveButtonTutorialElement);
      $scope.EDITOR_TUTORIAL_OPTIONS.splice(index, 1);
    }

    // Replace the ng-joyride template with one that uses <[...]> interpolators
    // instead of/ {{...}} interpolators.
    var ngJoyrideTemplate = $templateCache.get('ng-joyride-title-tplv1.html');
    ngJoyrideTemplate = ngJoyrideTemplate.replace(
      /\{\{/g, '<[').replace(/\}\}/g, ']>');
    $templateCache.put('ng-joyride-title-tplv1.html', ngJoyrideTemplate);

    var leaveTutorial = function() {
      EditabilityService.onEndTutorial();
      $scope.$apply();
      StateTutorialFirstTimeService.markEditorTutorialFinished();
      $scope.tutorialInProgress = false;
    };

    $scope.onSkipTutorial = function() {
      SiteAnalyticsService.registerSkipTutorialEvent($scope.explorationId);
      leaveTutorial();
    };

    $scope.onFinishTutorial = function() {
      SiteAnalyticsService.registerFinishTutorialEvent($scope.explorationId);
      leaveTutorial();
    };

    $scope.tutorialInProgress = false;
    $scope.startTutorial = function() {
      RouterService.navigateToMainTab();
      // The $timeout wrapper is needed for all components on the page to load,
      // otherwise elements within ng-if's are not guaranteed to be present on
      // the page.
      $timeout(function() {
        EditabilityService.onStartTutorial();
        $scope.tutorialInProgress = true;
      });
    };

    $scope.showWelcomeExplorationModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/' +
          'welcome_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$uibModalInstance', 'SiteAnalyticsService',
          'ContextService',
          function($scope, $uibModalInstance, SiteAnalyticsService,
              ContextService) {
            var explorationId = ContextService.getExplorationId();

            SiteAnalyticsService.registerTutorialModalOpenEvent(explorationId);

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
        $scope.startTutorial();
      }, function() {
        StateTutorialFirstTimeService.markEditorTutorialFinished();
      });
    };

    $scope.$on(
      'enterEditorForTheFirstTime', $scope.showWelcomeExplorationModal);
    $scope.$on('openEditorTutorial', $scope.startTutorial);
  }
]);
