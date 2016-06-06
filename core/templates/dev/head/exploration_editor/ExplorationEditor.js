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
  'autosaveInfoModalsService',
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
      autosaveInfoModalsService) {
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
          data.show_state_editor_tutorial_on_load);
      });
    };

    $scope.initExplorationPage();

    $scope.$on('initExplorationPage', function(unusedEvtData, successCallback) {
      $scope.initExplorationPage(successCallback);
    });

    var _ID_TUTORIAL_STATE_CONTENT = '#tutorialStateContent';
    var _ID_TUTORIAL_STATE_INTERACTION = '#tutorialStateInteraction';
    var _ID_TUTORIAL_EXPLORATION_OVERVIEW = '.oppia-state-graph-container';
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
        var positionToScrollTo = (
          isGoingForward ? 0 :
          angular.element(_ID_TUTORIAL_STATE_INTERACTION).offset().top - 200);
        $('html, body').animate({
          scrollTop: positionToScrollTo
        }, 1000);
      }
    }, {
      type: 'element',
      selector: _ID_TUTORIAL_EXPLORATION_OVERVIEW,
      heading: 'Exploration Overview',
      text: (
        'The exploration overview gives you a map-like view of all of the ' +
        'cards in your exploration and how they link together. ' +
        'You may need to drag around in the overview to see all ' +
        'of your cards if your exploration is large.'),
      placement: 'left'
    }, {
      type: 'function',
      fn: function(isGoingForward) {
        var idToScrollTo = (
          isGoingForward ? _ID_TUTORIAL_PREVIEW_TAB :
          _ID_TUTORIAL_EXPLORATION_OVERVIEW);
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

    $scope.onLeaveTutorial = function() {
      editabilityService.onEndTutorial();
      $scope.$apply();
      stateEditorTutorialFirstTimeService.markTutorialFinished();
      $scope.tutorialInProgress = false;
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
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.beginTutorial = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
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
  'threadDataService',
  function(
    $scope, $rootScope, $timeout, $modal, routerService,
    explorationRightsService, explorationWarningsService,
    stateEditorTutorialFirstTimeService,
    threadDataService) {
    $scope.postTutorialHelpPopoverIsShown = false;

    $scope.$on('openPostTutorialHelpPopover', function() {
      $scope.postTutorialHelpPopoverIsShown = true;
      $timeout(function() {
        $scope.postTutorialHelpPopoverIsShown = false;
      }, 5000);
    });

    // This method is here because the trigger for the tutorial is in the site
    // navbar. It broadcasts an event to tell the exploration editor to open the
    // editor tutorial.
    $scope.openEditorTutorial = function() {
      $rootScope.$broadcast('openEditorTutorial');
    };

    $scope.showUserHelpModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'modals/userHelp',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.beginTutorial = $modalInstance.close;

            $scope.goToHelpCenter = function() {
              $modalInstance.dismiss('cancel');
            };
          }
        ],
        windowClass: 'oppia-help-modal'
      });

      modalInstance.result.then(function() {
        $scope.openEditorTutorial();
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

oppia.controller('ExplorationSaveAndPublishButtons', [
  '$scope', '$http', '$rootScope', '$window', '$timeout', '$modal',
  'alertsService', 'changeListService', 'focusService', 'routerService',
  'explorationData', 'explorationRightsService', 'editabilityService',
  'explorationWarningsService', 'siteAnalyticsService',
  'explorationObjectiveService', 'explorationTitleService',
  'explorationCategoryService', 'explorationStatesService', 'CATEGORY_LIST',
  'explorationLanguageCodeService', 'explorationTagsService',
  'autosaveInfoModalsService',
  function(
      $scope, $http, $rootScope, $window, $timeout, $modal,
      alertsService, changeListService, focusService, routerService,
      explorationData, explorationRightsService, editabilityService,
      explorationWarningsService, siteAnalyticsService,
      explorationObjectiveService, explorationTitleService,
      explorationCategoryService, explorationStatesService, CATEGORY_LIST,
      explorationLanguageCodeService, explorationTagsService,
      autosaveInfoModalsService) {
    // Whether or not a save action is currently in progress.
    $scope.isSaveInProgress = false;
    // Whether or not a discard action is currently in progress.
    $scope.isDiscardInProgress = false;
    // The last 'save' or 'discard' action. Can be null (no such action has
    // been performed yet), 'save' (the last action was a save) or 'discard'
    // (the last action was a discard).
    $scope.lastSaveOrDiscardAction = null;

    $scope.isPrivate = function() {
      return explorationRightsService.isPrivate();
    };

    $scope.isExplorationLockedForEditing = function() {
      return changeListService.isExplorationLockedForEditing();
    };
    $scope.isEditableOutsideTutorialMode = function() {
      return editabilityService.isEditableOutsideTutorialMode();
    };
    $scope.countWarnings = function() {
      return explorationWarningsService.countWarnings();
    };

    $scope.discardChanges = function() {
      var confirmDiscard = confirm(
        'Are you sure you want to discard your changes?');

      if (confirmDiscard) {
        alertsService.clearWarnings();
        $rootScope.$broadcast('externalSave');

        $scope.isDiscardInProgress = true;
        changeListService.discardAllChanges();
        alertsService.addSuccessMessage('Changes discarded.');
        $rootScope.$broadcast('initExplorationPage', function() {
          $scope.lastSaveOrDiscardAction = 'discard';
          $scope.isDiscardInProgress = false;
        });

        // The reload is necessary because, otherwise, the
        // exploration-with-draft-changes will be reloaded (since it is already
        // cached in explorationData).
        location.reload();
      }
    };

    $scope.getChangeListLength = function() {
      return changeListService.getChangeList().length;
    };

    $scope.isExplorationSaveable = function() {
      return (
        $scope.isExplorationLockedForEditing() &&
        !$scope.isSaveInProgress && (
          ($scope.isPrivate() &&
            !explorationWarningsService.hasCriticalWarnings()) ||
          (!$scope.isPrivate() &&
            explorationWarningsService.countWarnings() === 0)
        )
      );
    };

    $scope.isPublic = function() {
      return explorationRightsService.isPublic();
    };

    $scope.showCongratulatorySharingModal = function() {
      $modal.open({
        templateUrl: 'modals/shareExplorationAfterPublish',
        backdrop: true,
        controller: ['$scope', function($scope) {
          $scope.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR = (
            GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
        }]
      });
    };

    var saveDraftToBackend = function(commitMessage, successCallback) {
      var changeList = changeListService.getChangeList();

      if ($scope.isPrivate()) {
        siteAnalyticsService.registerCommitChangesToPrivateExplorationEvent(
          explorationData.explorationId);
      } else {
        siteAnalyticsService.registerCommitChangesToPublicExplorationEvent(
          explorationData.explorationId);
      }

      $scope.isSaveInProgress = true;
      explorationData.save(changeList, commitMessage, function() {
        changeListService.discardAllChanges();
        $rootScope.$broadcast('initExplorationPage');
        $rootScope.$broadcast('refreshVersionHistory', {
          forceRefresh: true
        });
        alertsService.addSuccessMessage('Changes saved.');
        $scope.lastSaveOrDiscardAction = 'save';
        $scope.isSaveInProgress = false;
        if (successCallback) {
          successCallback();
        }
      }, function() {
        $scope.isSaveInProgress = false;
      });
    };

    var openPublishExplorationModal = function() {
      $scope.publishModalIsOpening = true;
      var publishModalInstance = $modal.open({
        templateUrl: 'modals/publishExploration',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.publish = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      });

      publishModalInstance.result.then(function() {
        explorationRightsService.saveChangeToBackend({
          is_public: true
        });
        siteAnalyticsService.registerPublishExplorationEvent(
          explorationData.explorationId);
        $scope.showCongratulatorySharingModal();
      });

      publishModalInstance.opened.then(function() {
        $scope.publishModalIsOpening = false;
      });
    };

    $scope.showPublishExplorationModal = function() {
      siteAnalyticsService.registerOpenPublishExplorationModalEvent(
        explorationData.explorationId);
      alertsService.clearWarnings();

      var additionalMetadataNeeded = (
        !explorationTitleService.savedMemento ||
        !explorationObjectiveService.savedMemento ||
        !explorationCategoryService.savedMemento ||
        explorationLanguageCodeService.savedMemento ===
          GLOBALS.DEFAULT_LANGUAGE_CODE ||
        explorationTagsService.savedMemento.length === 0);

      // If the metadata has not yet been specified, open the pre-publication
      // 'add exploration metadata' modal.
      if (additionalMetadataNeeded) {
        $modal.open({
          templateUrl: 'modals/addExplorationMetadata',
          backdrop: true,
          controller: [
            '$scope', '$modalInstance', 'explorationObjectiveService',
            'explorationTitleService', 'explorationCategoryService',
            'explorationStatesService', 'CATEGORY_LIST',
            'explorationLanguageCodeService', 'explorationTagsService',
            function($scope, $modalInstance, explorationObjectiveService,
            explorationTitleService, explorationCategoryService,
            explorationStatesService, CATEGORY_LIST,
            explorationLanguageCodeService, explorationTagsService) {
              $scope.explorationTitleService = explorationTitleService;
              $scope.explorationObjectiveService = explorationObjectiveService;
              $scope.explorationCategoryService = explorationCategoryService;
              $scope.explorationLanguageCodeService = (
                explorationLanguageCodeService);
              $scope.explorationTagsService = explorationTagsService;

              $scope.requireTitleToBeSpecified = (
                !explorationTitleService.savedMemento);
              $scope.requireObjectiveToBeSpecified = (
                !explorationObjectiveService.savedMemento);
              $scope.requireCategoryToBeSpecified = (
                !explorationCategoryService.savedMemento);
              $scope.askForLanguageCheck = (
                explorationLanguageCodeService.savedMemento ===
                GLOBALS.DEFAULT_LANGUAGE_CODE);
              $scope.askForTags = (
                explorationTagsService.savedMemento.length === 0);

              $scope.metadataList = [];

              $scope.TAG_REGEX = GLOBALS.TAG_REGEX;

              $scope.CATEGORY_LIST_FOR_SELECT2 = [];

              for (var i = 0; i < CATEGORY_LIST.length; i++) {
                $scope.CATEGORY_LIST_FOR_SELECT2.push({
                  id: CATEGORY_LIST[i],
                  text: CATEGORY_LIST[i]
                });
              }

              var _states = explorationStatesService.getStates();
              if (_states) {
                var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2
                .some(
                  function(categoryItem) {
                    return categoryItem.id ===
                    explorationCategoryService.savedMemento;
                  }
                );

                // If the current category is not in the dropdown, add it
                // as the first option.
                if (!categoryIsInSelect2 &&
                    explorationCategoryService.savedMemento) {
                  $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
                    id: explorationCategoryService.savedMemento,
                    text: explorationCategoryService.savedMemento
                  });
                }
              }

              $scope.isSavingAllowed = function() {
                var allMetadataDisplayed = (
                  explorationTitleService.displayed &&
                  explorationObjectiveService.displayed &&
                  explorationCategoryService.displayed &&
                  explorationLanguageCodeService.displayed);

                if (allMetadataDisplayed) {
                  return false;
                } else {
                  return true;
                }
              };

              $scope.save = function() {
                if (!explorationTitleService.displayed) {
                  alertsService.addWarning('Please specify a title');
                  return;
                }
                if (!explorationObjectiveService.displayed) {
                  alertsService.addWarning('Please specify an objective');
                  return;
                }
                if (!explorationCategoryService.displayed) {
                  alertsService.addWarning('Please specify a category');
                  return;
                }

                // Record any fields that have changed.
                if (explorationTitleService.hasChanged()) {
                  $scope.metadataList.push('title');
                }
                if (explorationObjectiveService.hasChanged()) {
                  $scope.metadataList.push('objective');
                }
                if (explorationCategoryService.hasChanged()) {
                  $scope.metadataList.push('category');
                }
                if (explorationLanguageCodeService.hasChanged()) {
                  $scope.metadataList.push('language');
                }
                if (explorationTagsService.hasChanged()) {
                  $scope.metadataList.push('tags');
                }

                // Save all the displayed values.
                explorationTitleService.saveDisplayedValue();
                explorationObjectiveService.saveDisplayedValue();
                explorationCategoryService.saveDisplayedValue();
                explorationLanguageCodeService.saveDisplayedValue();
                explorationTagsService.saveDisplayedValue();

                $modalInstance.close($scope.metadataList);
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                alertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(metadataList) {
          if (metadataList.length > 0) {
            var commitMessage = 'Add metadata to the exploration: ';
            for (var i = 0; i < metadataList.length; i++) {
              commitMessage += metadataList[i];
              if (i === metadataList.length - 1) {
                commitMessage += '.';
              } else {
                commitMessage += ', ';
              }
            }
            saveDraftToBackend(commitMessage, openPublishExplorationModal);
          } else {
            openPublishExplorationModal();
          }
        });
      } else {
        // No further metadata is needed. Open the publish modal immediately.
        openPublishExplorationModal();
      }
    };

    $scope.getPublishExplorationButtonTooltip = function() {
      if (explorationWarningsService.countWarnings() > 0) {
        return 'Please resolve the warnings before publishing.';
      } else if ($scope.isExplorationLockedForEditing()) {
        return 'Please save your changes before publishing.';
      } else {
        return 'Publish to Oppia Library';
      }
    };

    $scope.getSaveButtonTooltip = function() {
      if (explorationWarningsService.hasCriticalWarnings() > 0) {
        return 'Please resolve the warnings.';
      } else if ($scope.isPrivate()) {
        return 'Save Draft';
      } else {
        return 'Publish Changes';
      }
    };

    // This flag is used to ensure only one save exploration modal can be open
    // at any one time.
    var _modalIsOpen = false;

    $scope.saveChanges = function() {
      // This flag is used to change text of save button to "Loading..." to
      // add indication for user that something is happening.
      $scope.saveModalIsOpening = true;

      routerService.savePendingChanges();

      $scope.changeListSummaryUrl = (
        '/createhandler/change_list_summary/' + explorationData.explorationId);

      $http.post($scope.changeListSummaryUrl, {
        change_list: changeListService.getChangeList(),
        version: explorationData.data.version
      }).then(function(response) {
        var data = response.data;
        if (data.is_version_of_draft_valid === false) {
          autosaveInfoModalsService.showVersionMismatchModal(
            changeListService.getChangeList());
          return;
        }

        var explorationPropertyChanges = (
          data.summary.exploration_property_changes);
        var statePropertyChanges = data.summary.state_property_changes;
        var changedStates = data.summary.changed_states;
        var addedStates = data.summary.added_states;
        var deletedStates = data.summary.deleted_states;
        var gadgetPropertyChanges = data.summary.gadget_property_changes;
        var changedGadgets = data.summary.changed_gadgets;
        var addedGadgets = data.summary.added_gadgets;
        var deletedGadgets = data.summary.deleted_gadgets;
        var warningMessage = data.warning_message;

        var changesExist = (
          !$.isEmptyObject(explorationPropertyChanges) ||
          !$.isEmptyObject(statePropertyChanges) ||
          !$.isEmptyObject(gadgetPropertyChanges) ||
          changedStates.length > 0 ||
          changedGadgets.length > 0 ||
          addedStates.length > 0 ||
          addedGadgets.length > 0 ||
          deletedStates.length > 0 ||
          deletedGadgets.length > 0);

        if (!changesExist) {
          alertsService.addWarning('Your changes cancel each other out, ' +
            'so nothing has been saved.');
          $scope.saveModalIsOpening = false;
          changeListService.discardAllChanges();
          return;
        }

        if (!explorationRightsService.isPrivate() && warningMessage) {
          // If the exploration is not private, warnings should be fixed before
          // it can be saved.
          alertsService.addWarning(warningMessage);
          return;
        }

        alertsService.clearWarnings();

        // If the modal is open, do not open another one.
        if (_modalIsOpen) {
          return;
        }

        var modalInstance = $modal.open({
          templateUrl: 'modals/saveExploration',
          backdrop: true,
          resolve: {
            explorationPropertyChanges: function() {
              return explorationPropertyChanges;
            },
            statePropertyChanges: function() {
              return statePropertyChanges;
            },
            changedStates: function() {
              return changedStates;
            },
            addedStates: function() {
              return addedStates;
            },
            deletedStates: function() {
              return deletedStates;
            },
            gadgetPropertyChanges: function() {
              return gadgetPropertyChanges;
            },
            changedGadgets: function() {
              return changedGadgets;
            },
            addedGadgets: function() {
              return addedGadgets;
            },
            deletedGadgets: function() {
              return deletedGadgets;
            },
            isExplorationPrivate: function() {
              return explorationRightsService.isPrivate();
            }
          },
          controller: [
            '$scope', '$modalInstance', 'explorationPropertyChanges',
            'statePropertyChanges', 'changedStates', 'addedStates',
            'deletedStates', 'gadgetPropertyChanges', 'changedGadgets',
            'addedGadgets', 'deletedGadgets', 'isExplorationPrivate',
            function($scope, $modalInstance, explorationPropertyChanges,
                     statePropertyChanges, changedStates, addedStates,
                     deletedStates, gadgetPropertyChanges, changedGadgets,
                     addedGadgets, deletedGadgets, isExplorationPrivate) {
              $scope.explorationPropertyChanges = explorationPropertyChanges;
              $scope.statePropertyChanges = statePropertyChanges;
              $scope.changedStates = changedStates;
              $scope.addedStates = addedStates;
              $scope.deletedStates = deletedStates;
              $scope.gadgetPropertyChanges = gadgetPropertyChanges;
              $scope.changedGadgets = changedGadgets;
              $scope.addedGadgets = addedGadgets;
              $scope.deletedGadgets = deletedGadgets;
              $scope.isExplorationPrivate = isExplorationPrivate;

              // For reasons of backwards compatibility, the following keys
              // should not be changed.
              // TODO(sll): The keys for this dict already appear in
              // EditorServices.changeListService; consider deduplicating.
              var EXP_BACKEND_NAMES_TO_HUMAN_NAMES = {
                category: 'Category',
                init_state_name: 'First card',
                language_code: 'Language',
                objective: 'Objective',
                param_changes: 'Initial parameter changes',
                param_specs: 'Parameter specifications',
                tags: 'Tags',
                title: 'Title'
              };

              // For reasons of backwards compatibility, the following keys
              // should not be changed.
              var EXP_PROPERTIES_WHICH_ARE_SIMPLE_STRINGS = {
                category: true,
                init_state_name: true,
                objective: true,
                title: true
              };

              // For reasons of backwards compatibility, the following keys
              // should not be changed.
              var STATE_BACKEND_NAMES_TO_HUMAN_NAMES = {
                answer_groups: 'Responses',
                confirmed_unclassified_answers: (
                  'Confirmed unclassified answers'),
                content: 'Content',
                default_outcome: 'Default outcome',
                fallbacks: 'Fallbacks',
                name: 'Card name',
                param_changes: 'Parameter changes',
                widget_customization_args: 'Interaction customizations',
                widget_id: 'Interaction type'
              };

              // For reasons of backwards compatibility, the following keys
              // should not be changed.
              var GADGET_BACKEND_NAMES_TO_HUMAN_NAMES = {
                gadget_customization_args: 'Gadget customizations',
                gadget_visibility: 'Gadget visibility between states',
                name: 'Gadget name'
              };

              // An ordered list of state properties that determines the order
              // in which to show them in the save confirmation modal.
              // For reasons of backwards compatibility, the following keys
              // should not be changed.
              // TODO(sll): Implement this fully. Currently there is no sorting.
              $scope.ORDERED_STATE_PROPERTIES = [
                'name', 'param_changes', 'content', 'widget_id',
                'widget_customization_args', 'answer_groups',
                'default_outcome', 'fallbacks'
              ];

              $scope.explorationChangesExist = !$.isEmptyObject(
                $scope.explorationPropertyChanges);
              $scope.stateChangesExist = !$.isEmptyObject(
                $scope.statePropertyChanges);
              $scope.gadgetChangesExist = !$.isEmptyObject(
                $scope.gadgetPropertyChanges);

              var getLongFormPropertyChange = function(
                  humanReadableName, changeInfo) {
                return (
                  humanReadableName + ' (from \'' + changeInfo.old_value +
                  '\' to \'' + changeInfo.new_value + '\')');
              };

              $scope.formatExplorationPropertyChange = function(
                  propertyName, changeInfo) {
                if (EXP_PROPERTIES_WHICH_ARE_SIMPLE_STRINGS[propertyName]) {
                  return getLongFormPropertyChange(
                    EXP_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                    changeInfo);
                } else {
                  return EXP_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
                }
              };

              $scope.formatStatePropertyChange = function(
                  propertyName, changeInfo) {
                if (propertyName == 'name') {
                  return getLongFormPropertyChange(
                    STATE_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                    changeInfo);
                } else {
                  return STATE_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
                }
              };

              $scope.formatGadgetPropertyChange = function(
                  propertyName, changeInfo) {
                if (propertyName == 'name') {
                  return getLongFormPropertyChange(
                    GADGET_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                    changeInfo);
                } else {
                  return GADGET_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
                }
              };

              $scope.formatStateList = function(stateList) {
                return stateList.join('; ');
              };

              $scope.formatGadgetList = function(gadgetList) {
                return gadgetList.join('; ');
              };

              $scope.save = function(commitMessage) {
                $modalInstance.close(commitMessage);
              };
              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                alertsService.clearWarnings();
              };
            }
          ]
        });

        // Modal is Opened
        _modalIsOpen = true;
        $scope.saveModalIsOpening = false;

        modalInstance.opened.then(function() {
          // The $timeout seems to be needed in order to give the modal time to
          // render.
          $timeout(function() {
            focusService.setFocus('saveChangesModalOpened');
          });
        });

        modalInstance.result.then(function(commitMessage) {
          _modalIsOpen = false;
          saveDraftToBackend(commitMessage);
        }, function() {
          _modalIsOpen = false;
        });
      });
    };
  }
]);
