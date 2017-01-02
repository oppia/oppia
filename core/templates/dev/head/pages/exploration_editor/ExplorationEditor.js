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
oppia.constant('GADGET_SPECS', GLOBALS.GADGET_SPECS);
oppia.constant('PANEL_SPECS', GLOBALS.PANEL_SPECS);
oppia.constant(
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  'explorationTitleInputFocusLabel');

oppia.controller('ExplorationEditor', [
  '$scope', '$http', '$window', '$rootScope', '$log', '$timeout',
  'explorationData', 'editorContextService', 'explorationTitleService',
  'explorationCategoryService', 'explorationGadgetsService',
  'explorationObjectiveService', 'explorationLanguageCodeService',
  'explorationRightsService', 'explorationInitStateNameService',
  'explorationTagsService', 'editabilityService', 'explorationStatesService',
  'routerService', 'graphDataService', 'stateEditorTutorialFirstTimeService',
  'explorationParamSpecsService', 'explorationParamChangesService',
  'explorationWarningsService', '$templateCache', 'explorationContextService',
  'explorationAdvancedFeaturesService', '$modal', 'changeListService',
  'autosaveInfoModalsService', 'siteAnalyticsService',
  function(
      $scope, $http, $window, $rootScope, $log, $timeout,
      explorationData, editorContextService, explorationTitleService,
      explorationCategoryService, explorationGadgetsService,
      explorationObjectiveService, explorationLanguageCodeService,
      explorationRightsService, explorationInitStateNameService,
      explorationTagsService, editabilityService, explorationStatesService,
      routerService, graphDataService, stateEditorTutorialFirstTimeService,
      explorationParamSpecsService, explorationParamChangesService,
      explorationWarningsService, $templateCache, explorationContextService,
      explorationAdvancedFeaturesService, $modal, changeListService,
      autosaveInfoModalsService, siteAnalyticsService) {
    $scope.editabilityService = editabilityService;
    $scope.editorContextService = editorContextService;

    $scope.areGadgetsEnabled = (
      explorationAdvancedFeaturesService.areGadgetsEnabled);

    /**********************************************************
     * Called on initial load of the exploration editor page.
     *********************************************************/
    $rootScope.loadingMessage = 'Loading';

    $scope.explorationId = explorationContextService.getExplorationId();
    $scope.explorationUrl = '/create/' + $scope.explorationId;
    $scope.explorationDataUrl = '/createhandler/data/' + $scope.explorationId;
    $scope.explorationDownloadUrl = (
      '/createhandler/download/' + $scope.explorationId);
    $scope.revertExplorationUrl = (
      '/createhandler/revert/' + $scope.explorationId);

    $scope.getTabStatuses = routerService.getTabStatuses;

    /********************************************
    * Methods affecting the graph visualization.
    ********************************************/
    $scope.areExplorationWarningsVisible = false;
    $scope.toggleExplorationWarningVisibility = function() {
      $scope.areExplorationWarningsVisible = (
        !$scope.areExplorationWarningsVisible);
    };

    $scope.$on('refreshGraph', function() {
      graphDataService.recompute();
      explorationWarningsService.updateWarnings();
    });

    $scope.getExplorationUrl = function(explorationId) {
      return explorationId ? ('/explore/' + explorationId) : '';
    };

    // Initializes the exploration page using data from the backend. Called on
    // page load.
    $scope.initExplorationPage = function(successCallback) {
      explorationData.getData().then(function(data) {
        explorationStatesService.init(data.states);

        explorationTitleService.init(data.title);
        explorationCategoryService.init(data.category);
        explorationGadgetsService.init(data.skin_customizations);
        explorationObjectiveService.init(data.objective);
        explorationLanguageCodeService.init(data.language_code);
        explorationInitStateNameService.init(data.init_state_name);
        explorationTagsService.init(data.tags);
        explorationParamSpecsService.init(data.param_specs);
        explorationParamChangesService.init(data.param_changes || []);

        $scope.explorationTitleService = explorationTitleService;
        $scope.explorationCategoryService = explorationCategoryService;
        $scope.explorationGadgetsService = explorationGadgetsService;
        $scope.explorationObjectiveService = explorationObjectiveService;
        $scope.explorationRightsService = explorationRightsService;
        $scope.explorationInitStateNameService = (
          explorationInitStateNameService);

        $scope.currentUserIsAdmin = data.is_admin;
        $scope.currentUserIsModerator = data.is_moderator;

        $scope.currentUser = data.user;
        $scope.currentVersion = data.version;

        explorationAdvancedFeaturesService.init(data);
        explorationRightsService.init(
          data.rights.owner_names, data.rights.editor_names,
          data.rights.viewer_names, data.rights.status,
          data.rights.cloned_from, data.rights.community_owned,
          data.rights.viewable_if_private);

        if (GLOBALS.can_edit) {
          editabilityService.markEditable();
        }

        graphDataService.recompute();

        if (!editorContextService.getActiveStateName() ||
            !explorationStatesService.getState(
              editorContextService.getActiveStateName())) {
          editorContextService.setActiveStateName(
            explorationInitStateNameService.displayed);
        }

        if (!routerService.isLocationSetToNonStateEditorTab() &&
            !data.states.hasOwnProperty(
              routerService.getCurrentStateFromLocationPath('gui'))) {
          routerService.navigateToMainTab();
        }

        explorationWarningsService.updateWarnings();

        // Initialize changeList by draft changes if they exist.
        if (data.draft_changes !== null) {
          changeListService.loadAutosavedChangeList(data.draft_changes);
        }

        if (data.is_version_of_draft_valid === false &&
            data.draft_changes !== null &&
            data.draft_changes.length > 0) {
          // Show modal displaying lost changes if the version of draft
          // changes is invalid, and draft_changes is not `null`.
          autosaveInfoModalsService.showVersionMismatchModal(
            changeListService.getChangeList());
          return;
        }

        $scope.$broadcast('refreshStatisticsTab');
        $scope.$broadcast('refreshVersionHistory', {
          forceRefresh: true
        });

        if (explorationStatesService.getState(
              editorContextService.getActiveStateName())) {
          $scope.$broadcast('refreshStateEditor');
        }

        if (successCallback) {
          successCallback();
        }

        stateEditorTutorialFirstTimeService.init(
          data.show_state_editor_tutorial_on_load, $scope.explorationId);
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
        '<p>An Oppia exploration is divided into several \'cards.\' ' +
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
        'An interaction is how you want your leaner to respond ' +
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
      editabilityService.onEndTutorial();
      $scope.$apply();
      stateEditorTutorialFirstTimeService.markTutorialFinished();
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
      routerService.navigateToMainTab();
      // The $timeout wrapper is needed for all components on the page to load,
      // otherwise elements within ng-if's are not guaranteed to be present on
      // the page.
      $timeout(function() {
        editabilityService.onStartTutorial();
        $scope.tutorialInProgress = true;
      });
    };

    $scope.showWelcomeExplorationModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'modals/welcomeExploration',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', 'UrlInterpolationService',
          'siteAnalyticsService', 'explorationContextService',
          function($scope, $modalInstance, UrlInterpolationService,
              siteAnalyticsService, explorationContextService) {
            var explorationId = explorationContextService.getExplorationId();

            siteAnalyticsService.registerTutorialModalOpenEvent(explorationId);

            $scope.beginTutorial = function() {
              siteAnalyticsService.registerAcceptTutorialModalEvent(
                explorationId);
              $modalInstance.close();
            };

            $scope.cancel = function() {
              siteAnalyticsService.registerDeclineTutorialModalEvent(
                explorationId);
              $modalInstance.dismiss('cancel');
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
        stateEditorTutorialFirstTimeService.markTutorialFinished();
      });
    };

    $scope.$on(
      'enterEditorForTheFirstTime', $scope.showWelcomeExplorationModal);
    $scope.$on('openEditorTutorial', $scope.startTutorial);
  }
]);

oppia.controller('EditorNavigation', [
  '$scope', '$rootScope', '$timeout', '$modal', 'routerService',
  'explorationRightsService', 'explorationWarningsService',
  'stateEditorTutorialFirstTimeService',
  'threadDataService', 'siteAnalyticsService',
  'explorationContextService', 'windowDimensionsService',
  function(
    $scope, $rootScope, $timeout, $modal, routerService,
    explorationRightsService, explorationWarningsService,
    stateEditorTutorialFirstTimeService,
    threadDataService, siteAnalyticsService,
    explorationContextService, windowDimensionsService) {
    $scope.postTutorialHelpPopoverIsShown = false;

    $scope.$on('openPostTutorialHelpPopover', function() {
      if (windowDimensionsService.getWidth() >= 1024) {
        $scope.postTutorialHelpPopoverIsShown = true;
        $timeout(function() {
          $scope.postTutorialHelpPopoverIsShown = false;
        }, 5000);
      }
    });

    $scope.showUserHelpModal = function() {
      var explorationId = explorationContextService.getExplorationId();
      siteAnalyticsService.registerClickHelpButtonEvent(explorationId);
      var modalInstance = $modal.open({
        templateUrl: 'modals/userHelp',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance',
          'siteAnalyticsService', 'explorationContextService',
          function(
            $scope, $modalInstance,
            siteAnalyticsService, explorationContextService) {
            var explorationId = explorationContextService.getExplorationId();

            $scope.beginTutorial = function() {
              siteAnalyticsService.registerOpenTutorialFromHelpCenterEvent(
                explorationId);
              $modalInstance.close();
            };

            $scope.goToHelpCenter = function() {
              siteAnalyticsService.registerVisitHelpCenterEvent(explorationId);
              $modalInstance.dismiss('cancel');
            };
          }
        ],
        windowClass: 'oppia-help-modal'
      });

      modalInstance.result.then(function() {
        $rootScope.$broadcast('openEditorTutorial');
      }, function() {
        stateEditorTutorialFirstTimeService.markTutorialFinished();
      });
    };

    $scope.countWarnings = explorationWarningsService.countWarnings;
    $scope.getWarnings = explorationWarningsService.getWarnings;
    $scope.hasCriticalWarnings = explorationWarningsService.hasCriticalWarnings;

    $scope.explorationRightsService = explorationRightsService;
    $scope.getTabStatuses = routerService.getTabStatuses;
    $scope.selectMainTab = routerService.navigateToMainTab;
    $scope.selectPreviewTab = routerService.navigateToPreviewTab;
    $scope.selectSettingsTab = routerService.navigateToSettingsTab;
    $scope.selectStatsTab = routerService.navigateToStatsTab;
    $scope.selectHistoryTab = routerService.navigateToHistoryTab;
    $scope.selectFeedbackTab = routerService.navigateToFeedbackTab;
    $scope.getOpenThreadsCount = threadDataService.getOpenThreadsCount;
  }
]);

oppia.controller('EditorNavbarBreadcrumb', [
  '$scope', 'explorationTitleService', 'routerService', 'focusService',
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  function(
      $scope, explorationTitleService, routerService, focusService,
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL) {
    $scope.navbarTitle = null;
    $scope.$on('explorationPropertyChanged', function() {
      var _MAX_TITLE_LENGTH = 20;
      $scope.navbarTitle = explorationTitleService.savedMemento;
      if ($scope.navbarTitle.length > _MAX_TITLE_LENGTH) {
        $scope.navbarTitle = (
          $scope.navbarTitle.substring(0, _MAX_TITLE_LENGTH - 3) + '...');
      }
    });

    $scope.editTitle = function() {
      routerService.navigateToSettingsTab();
      focusService.setFocus(EXPLORATION_TITLE_INPUT_FOCUS_LABEL);
    };

    var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
      main: 'Edit',
      preview: 'Preview',
      settings: 'Settings',
      stats: 'Statistics',
      history: 'History',
      feedback: 'Feedback'
    };

    $scope.getCurrentTabName = function() {
      if (!routerService.getTabStatuses()) {
        return '';
      } else {
        return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[
          routerService.getTabStatuses().active];
      }
    };
  }
]);
