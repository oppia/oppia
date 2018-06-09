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
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');

oppia.controller('ExplorationEditor', [
  '$scope', '$http', '$window', '$rootScope', '$log', '$timeout',
  'ExplorationDataService', 'EditorStateService', 'ExplorationTitleService',
  'ExplorationCategoryService', 'ExplorationObjectiveService',
  'ExplorationLanguageCodeService', 'ExplorationRightsService',
  'ExplorationInitStateNameService', 'ExplorationTagsService',
  'EditabilityService', 'ExplorationStatesService', 'RouterService',
  'GraphDataService', 'StateEditorTutorialFirstTimeService',
  'ExplorationParamSpecsService', 'ExplorationParamChangesService',
  'ExplorationWarningsService', '$templateCache', 'ExplorationContextService',
  'ExplorationAdvancedFeaturesService', '$uibModal', 'ChangeListService',
  'AutosaveInfoModalsService', 'siteAnalyticsService',
  'UserEmailPreferencesService', 'ParamChangesObjectFactory',
  'ParamSpecsObjectFactory', 'ExplorationAutomaticTextToSpeechService',
  'UrlInterpolationService', 'ExplorationCorrectnessFeedbackService',
  'ThreadDataService',
  function(
      $scope, $http, $window, $rootScope, $log, $timeout,
      ExplorationDataService, EditorStateService, ExplorationTitleService,
      ExplorationCategoryService, ExplorationObjectiveService,
      ExplorationLanguageCodeService, ExplorationRightsService,
      ExplorationInitStateNameService, ExplorationTagsService,
      EditabilityService, ExplorationStatesService, RouterService,
      GraphDataService, StateEditorTutorialFirstTimeService,
      ExplorationParamSpecsService, ExplorationParamChangesService,
      ExplorationWarningsService, $templateCache, ExplorationContextService,
      ExplorationAdvancedFeaturesService, $uibModal, ChangeListService,
      AutosaveInfoModalsService, siteAnalyticsService,
      UserEmailPreferencesService, ParamChangesObjectFactory,
      ParamSpecsObjectFactory, ExplorationAutomaticTextToSpeechService,
      UrlInterpolationService, ExplorationCorrectnessFeedbackService,
      ThreadDataService) {
    $scope.EditabilityService = EditabilityService;
    $scope.EditorStateService = EditorStateService;

    /** ********************************************************
     * Called on initial load of the exploration editor page.
     *********************************************************/
    $rootScope.loadingMessage = 'Loading';

    $scope.explorationId = ExplorationContextService.getExplorationId();
    $scope.explorationUrl = '/create/' + $scope.explorationId;
    $scope.explorationDownloadUrl = (
      '/createhandler/download/' + $scope.explorationId);
    $scope.revertExplorationUrl = (
      '/createhandler/revert/' + $scope.explorationId);

    $scope.getTabStatuses = RouterService.getTabStatuses;

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
      ExplorationDataService.getData(function(explorationId, lostChanges) {
        if (!AutosaveInfoModalsService.isModalOpen()) {
          AutosaveInfoModalsService.showLostChangesModal(
            lostChanges, explorationId);
        }
      }).then(function(data) {
        ExplorationStatesService.init(data.states);

        ExplorationTitleService.init(data.title);
        ExplorationCategoryService.init(data.category);
        ExplorationObjectiveService.init(data.objective);
        ExplorationLanguageCodeService.init(data.language_code);
        ExplorationInitStateNameService.init(data.init_state_name);
        ExplorationTagsService.init(data.tags);
        ExplorationParamSpecsService.init(
          ParamSpecsObjectFactory.createFromBackendDict(data.param_specs));
        ExplorationParamChangesService.init(
          ParamChangesObjectFactory.createFromBackendList(data.param_changes));
        ExplorationAutomaticTextToSpeechService.init(data.auto_tts_enabled);
        ExplorationCorrectnessFeedbackService.init(
          data.correctness_feedback_enabled);

        $scope.explorationTitleService = ExplorationTitleService;
        $scope.explorationCategoryService = ExplorationCategoryService;
        $scope.explorationObjectiveService = ExplorationObjectiveService;
        $scope.ExplorationRightsService = ExplorationRightsService;
        $scope.explorationInitStateNameService = (
          ExplorationInitStateNameService);

        $scope.currentUserIsAdmin = data.is_admin;
        $scope.currentUserIsModerator = data.is_moderator;

        $scope.currentUser = data.user;
        $scope.currentVersion = data.version;

        ExplorationAdvancedFeaturesService.init(data);
        ExplorationRightsService.init(
          data.rights.owner_names, data.rights.editor_names,
          data.rights.viewer_names, data.rights.status,
          data.rights.cloned_from, data.rights.community_owned,
          data.rights.viewable_if_private);
        UserEmailPreferencesService.init(
          data.email_preferences.mute_feedback_notifications,
          data.email_preferences.mute_suggestion_notifications);

        if (GLOBALS.can_edit) {
          EditabilityService.markEditable();
        }

        GraphDataService.recompute();

        if (!EditorStateService.getActiveStateName() ||
            !ExplorationStatesService.getState(
              EditorStateService.getActiveStateName())) {
          EditorStateService.setActiveStateName(
            ExplorationInitStateNameService.displayed);
        }

        if (!RouterService.isLocationSetToNonStateEditorTab() &&
            !data.states.hasOwnProperty(
              RouterService.getCurrentStateFromLocationPath('gui'))) {
          if (ThreadDataService.getOpenThreadsCount() > 0) {
            RouterService.navigateToFeedbackTab();
          } else {
            RouterService.navigateToMainTab();
          }
        }

        ExplorationWarningsService.updateWarnings();

        // Initialize changeList by draft changes if they exist.
        if (data.draft_changes !== null) {
          ChangeListService.loadAutosavedChangeList(data.draft_changes);
        }

        if (data.is_version_of_draft_valid === false &&
            data.draft_changes !== null &&
            data.draft_changes.length > 0) {
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
          EditorStateService.getActiveStateName())) {
          $scope.$broadcast('refreshStateEditor');
        }

        if (successCallback) {
          successCallback();
        }

        StateEditorTutorialFirstTimeService.init(
          data.show_state_editor_tutorial_on_load, $scope.explorationId);

        if (ExplorationRightsService.isPublic()) {
          // Don't make user wait on stats to begin editing the exploration.
          StateTopAnswersStatsBackendApiService.fetchStats(
            $scope.explorationId
          ).then(StateTopAnswersStatsService.init);
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
    }, {
      type: 'element',
      selector: _ID_TUTORIAL_SAVE_BUTTON,
      heading: 'Save',
      text: (
        'When you\'re done making changes, ' +
        'be sure to save your work.<br><br>'),
      placement: 'bottom'
    }, {
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

    // Replace the ng-joyride template with one that uses <[...]> interpolators
    // instead of/ {{...}} interpolators.
    var ngJoyrideTemplate = $templateCache.get('ng-joyride-title-tplv1.html');
    ngJoyrideTemplate = ngJoyrideTemplate.replace(
      /\{\{/g, '<[').replace(/\}\}/g, ']>');
    $templateCache.put('ng-joyride-title-tplv1.html', ngJoyrideTemplate);

    var leaveTutorial = function() {
      EditabilityService.onEndTutorial();
      $scope.$apply();
      StateEditorTutorialFirstTimeService.markTutorialFinished();
      $scope.tutorialInProgress = false;
    };

    $scope.onSkipTutorial = function() {
      siteAnalyticsService.registerSkipTutorialEvent($scope.explorationId);
      leaveTutorial();
    };

    $scope.onFinishTutorial = function() {
      siteAnalyticsService.registerFinishTutorialEvent($scope.explorationId);
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
          '$scope', '$uibModalInstance', 'siteAnalyticsService',
          'ExplorationContextService',
          function($scope, $uibModalInstance, siteAnalyticsService,
              ExplorationContextService) {
            var explorationId = ExplorationContextService.getExplorationId();

            siteAnalyticsService.registerTutorialModalOpenEvent(explorationId);

            $scope.beginTutorial = function() {
              siteAnalyticsService.registerAcceptTutorialModalEvent(
                explorationId);
              $uibModalInstance.close();
            };

            $scope.cancel = function() {
              siteAnalyticsService.registerDeclineTutorialModalEvent(
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
        StateEditorTutorialFirstTimeService.markTutorialFinished();
      });
    };

    $scope.$on(
      'enterEditorForTheFirstTime', $scope.showWelcomeExplorationModal);
    $scope.$on('openEditorTutorial', $scope.startTutorial);
  }
]);
