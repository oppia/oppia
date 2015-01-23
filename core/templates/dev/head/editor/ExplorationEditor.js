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
 * @fileoverview Controllers for the exploration editor page and the editor help tab
 *               in the navbar.
 *
 * @author sll@google.com (Sean Lip)
 */

// TODO(sll): Move all hardcoded strings to the top of the file.
var END_DEST = 'END';

oppia.controller('ExplorationEditor', [
  '$scope', '$http', '$modal', '$window', '$filter', '$rootScope',
  '$log', '$timeout', 'explorationData', 'warningsData', 'activeInputData',
  'editorContextService', 'changeListService', 'explorationTitleService',
  'explorationCategoryService', 'explorationObjectiveService', 'explorationLanguageCodeService',
  'explorationRightsService', 'explorationInitStateNameService', 'validatorsService', 'editabilityService',
  'oppiaDatetimeFormatter', 'interactionRepositoryService', 'newStateTemplateService', 'oppiaPlayerService',
  'explorationStatesService', 'routerService', 'graphDataService', 'focusService', 'stateEditorTutorialFirstTimeService',
  'explorationParamSpecsService', 'explorationWarningsService', 'previewModeService',
  function(
    $scope, $http, $modal, $window, $filter, $rootScope,
    $log, $timeout, explorationData, warningsData, activeInputData,
    editorContextService, changeListService, explorationTitleService,
    explorationCategoryService, explorationObjectiveService, explorationLanguageCodeService,
    explorationRightsService, explorationInitStateNameService, validatorsService,
    editabilityService, oppiaDatetimeFormatter, interactionRepositoryService,
    newStateTemplateService, oppiaPlayerService, explorationStatesService, routerService,
    graphDataService, focusService, stateEditorTutorialFirstTimeService,
    explorationParamSpecsService, explorationWarningsService, previewModeService) {

  $scope.editabilityService = editabilityService;

  $scope.isInPreviewMode = function() {
    return previewModeService.isInPreviewMode();
  };

  $scope.enterPreviewMode = function() {
    $rootScope.$broadcast('externalSave');
    oppiaPlayerService.populateExploration({
      states: explorationStatesService.getStates(),
      init_state_name: explorationInitStateNameService.savedMemento,
      param_specs: explorationParamSpecsService.savedMemento,
      title: explorationTitleService.savedMemento,
      // TODO(sll): are these actually editable?
      param_changes: explorationData.data.param_changes
    });
    $timeout(function() {
      previewModeService.turnOnPreviewMode();
    });
  };

  $scope.exitPreviewMode = function() {
    previewModeService.turnOffPreviewMode();
    $timeout(function() {
      routerService.navigateToMainTab(oppiaPlayerService.getCurrentStateName());
      $scope.$broadcast('refreshStateEditor');
    });
  };

  // TODO(sll): Remove this when possible. This is currently needed for the
  // editor/preview mode to function, but it exposes what should be a private
  // variable.
  $scope.previewModeData = previewModeService.data;
  $scope.previewModeData.isInPreviewMode = false;

  /**********************************************************
   * Called on initial load of the exploration editor page.
   *********************************************************/
  $rootScope.loadingMessage = 'Loading';

  // The pathname should be: .../create/{exploration_id}
  var _pathnameArray = window.location.pathname.split('/');
  $scope.explorationId = _pathnameArray[_pathnameArray.length - 1];
  // The exploration id needs to be attached to the root scope in order for
  // the file picker RTE component to work. (Note that an alternative approach
  // might also be to replicate this URL-based calculation in the file picker
  // RTE component.)
  $rootScope.explorationId = $scope.explorationId;
  $scope.explorationUrl = '/create/' + $scope.explorationId;
  $scope.explorationDataUrl = '/createhandler/data/' + $scope.explorationId;
  $scope.explorationDownloadUrl = '/createhandler/download/' + $scope.explorationId;
  $scope.revertExplorationUrl = '/createhandler/revert/' + $scope.explorationId;

  $scope.getTabStatuses = routerService.getTabStatuses;

  /********************************************
  * Methods affecting the graph visualization.
  ********************************************/
  $scope.areExplorationWarningsVisible = false;
  $scope.toggleExplorationWarningVisibility = function() {
    $scope.areExplorationWarningsVisible = !$scope.areExplorationWarningsVisible;
  };

  $scope.$on('refreshGraph', function() {
    graphDataService.recompute();
    explorationWarningsService.updateWarnings();
  });

  $scope.countWarnings = explorationWarningsService.countWarnings;
  $scope.getWarnings = explorationWarningsService.getWarnings;

  $scope.initializeNewActiveInput = function(newActiveInput) {
    // TODO(sll): Rework this so that in general it saves the current active
    // input, if any, first. If it is bad input, display a warning and cancel
    // the effects of the old change. But, for now, each case is handled
    // specially.
    $log.info('Current Active Input: ' + activeInputData.name);

    var inputArray = newActiveInput.split('.');

    activeInputData.name = (newActiveInput || '');
    // TODO(sll): Initialize the newly displayed field.
  };

  $scope.getExplorationUrl = function(explorationId) {
    return explorationId ? ('/explore/' + explorationId) : '';
  };

  // Initializes the exploration page using data from the backend. Called on
  // page load.
  $scope.initExplorationPage = function(successCallback) {
    explorationData.getData().then(function(data) {
      interactionRepositoryService.setInteractionRepository(data.ALL_INTERACTIONS);
      explorationStatesService.setStates(data.states);

      explorationTitleService.init(data.title);
      explorationCategoryService.init(data.category);
      explorationObjectiveService.init(data.objective);
      explorationLanguageCodeService.init(data.language_code);
      explorationInitStateNameService.init(data.init_state_name);
      explorationParamSpecsService.init(data.param_specs);

      $scope.explorationTitleService = explorationTitleService;
      $scope.explorationCategoryService = explorationCategoryService;
      $scope.explorationObjectiveService = explorationObjectiveService;
      $scope.explorationRightsService = explorationRightsService;
      $scope.explorationInitStateNameService = explorationInitStateNameService;

      $scope.currentUserIsAdmin = data.is_admin;
      $scope.currentUserIsModerator = data.is_moderator;
      $scope.defaultSkinId = data.default_skin_id;
      $scope.allSkinIds = data.all_skin_ids;

      $scope.currentUser = data.user;
      $scope.currentVersion = data.version;

      explorationRightsService.init(
        data.rights.owner_names, data.rights.editor_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from, data.rights.community_owned,
        data.rights.viewable_if_private);

      if (GLOBALS.can_edit) {
        editabilityService.markEditable();
      }

      graphDataService.recompute();

      if (!editorContextService.getActiveStateName() ||
          !explorationStatesService.getState(editorContextService.getActiveStateName())) {
        editorContextService.setActiveStateName(explorationInitStateNameService.displayed);
      }

      if (!routerService.isLocationSetToNonStateEditorTab() &&
          !data.states.hasOwnProperty(routerService.getCurrentStateFromLocationPath())) {
        routerService.navigateToMainTab();
      }

      explorationWarningsService.updateWarnings();

      $rootScope.loadingMessage = '';

      $scope.$broadcast('refreshStatisticsTab');
      $scope.$broadcast('refreshVersionHistory', {forceRefresh: true});

      if (explorationStatesService.getState(editorContextService.getActiveStateName())) {
        $scope.$broadcast('refreshStateEditor');
      }

      if (successCallback) {
        successCallback();
      }

      stateEditorTutorialFirstTimeService.init(data.show_state_editor_tutorial_on_load, $scope.explorationId);
    });
  };

  $scope.initExplorationPage();

  $scope.$on('initExplorationPage', function(unusedEventData, successCallback) {
    $scope.initExplorationPage(successCallback);
  });

  // Constants and methods relating to the state editor tutorial.
  $scope.EDITOR_TUTORIAL_OPTIONS = {
    disableInteraction: true,
    doneLabel: 'Let\'s go!',
    exitOnEsc: true,
    exitOnOverlayClick: true,
    keyboardNavigation: true,
    scrollToElement: true,
    showBullets: false,
    showProgress: true,
    showStepNumbers: false,
    skipLabel: 'Exit',
    tooltipClass: 'oppia-tutorial-tooltip',
    steps: [{
      intro: (
        '<b>Welcome to the Oppia editor tutorial!</b><br><br>' +
        'Oppia explorations mimic one-on-one conversations which are ' +
        'divided into \'states\'. <br><br>A state consists of something you say, ' +
        'followed by the learner\'s response. Based on the response, ' +
        'you can decide what to say next.')
    }, {
      element: '#tutorialStateContent',
      intro: (
        'In the <b>Content</b> section, type what you want to tell the ' +
        'learner before they respond. Here\'s an example:<br><br>' +
        '<em>"Jane bought a new alarm clock with a 12-hour display. It now shows ' +
        '12:45 and she wants to leave the house for lunch in half an hour. <br><br>' +
        'What time should she set the alarm to?"</em>')
    }, {
      element: '#tutorialStateInteraction',
      position: 'top',
      intro: (
        'In the <b>Interaction</b> section, you can choose how the learner ' +
        'responds. You can edit details of the interaction by clicking on it.<br><br>' +
        'For example, you could select a \'text\' input (which means the ' +
        'learner is expected to enter some text), then customize it so that the ' +
        'placeholder text says <em>\'Type the time here\'</em>.')
    }, {
      element: '#tutorialStateRules',
      position: 'top',
      intro: (
        'After the learner responds, you can choose how you reply by ' +
        'creating a <b>rule</b>. You can create different replies to different ' +
        'responses, just as you would in a face-to-face conversation. For example:<br><br>' +
        '<ul><li>If the learner types \'1:15\', you might send them to a new state that ' +
        'congratulates them on solving the problem and poses a follow-up question.</li>' +
        '<li>If the learner types \'13:15\', you might instead reply: ' +
        '<em>"Remember, there is no \'13\' on a 12-hour clock. Try again?"</em>' +
        '</li></ul>')
    }, {
      element: '#tutorialExplorationGraph',
      position: 'left',
      intro: (
        'The <b>exploration graph</b> shows how your states relate to one another.<br><br>' +
        'You can navigate to individual states by clicking on them, and you can also click ' +
        'the top-right button to expand the graph.')
    }, {
      element: '#tutorialPreviewExplorationButton',
      position: 'left',
      intro: (
        'At any time, click the \'Preview\' button to preview an interactive version ' +
        'of your exploration, where you can interact with it as a student would! This ' +
        'is very useful for ensuring that the learning experience feels natural and ' +
        'enjoyable.')
    }, {
      element: '#tutorialSaveExplorationButton',
      position: 'left',
      intro: (
        'Finally, when you\'re happy with your changes, click the \'Save\' button. ' +
        'This stores your changes so that they will appear when a learner next ' +
        'plays the exploration.')
    }, {
      intro: (
        'This completes the Oppia editor tutorial. For more information, including ' +
        'exploration design tips, see the \'Help\' menu at the top of this ' +
        'page.<br><br> If you run into any issues, feel free to post in the site ' +
        'forum. Have fun!')
    }]
  };

  $scope._actuallyStartTutorial = function() {
    var intro = introJs();
    intro.setOptions($scope.EDITOR_TUTORIAL_OPTIONS);

    var _onLeaveTutorial = function() {
      editabilityService.onEndTutorial();
      $scope.$apply();
      stateEditorTutorialFirstTimeService.markTutorialFinished();
    };

    intro.onexit(_onLeaveTutorial);
    intro.oncomplete(_onLeaveTutorial);

    editabilityService.onStartTutorial();
    intro.start();
  };

  $scope.startTutorial = function(firstTime) {
    if (previewModeService.isInPreviewMode()) {
      $scope.exitPreviewMode();
    } else {
      routerService.navigateToMainTab();
    }

    // The $timeout wrapper is needed for all components on the page to load,
    // otherwise elements within ng-if's are not guaranteed to be present on
    // the page.
    $timeout($scope._actuallyStartTutorial);
  };

  $scope.$on('openEditorTutorial', $scope.startTutorial);
}]);


oppia.controller('EditorNavigation', [
    '$scope', '$rootScope', '$timeout', 'routerService', 'explorationRightsService',
    function($scope, $rootScope, $timeout, routerService, explorationRightsService) {
  $scope.postTutorialHelpPopoverIsShown = false;

  $scope.$on('openPostTutorialHelpPopover', function() {
    $scope.postTutorialHelpPopoverIsShown = true;
    // Without this, the popover does not trigger.
    $scope.$apply();
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

  $scope.explorationRightsService = explorationRightsService;
  $scope.getTabStatuses = routerService.getTabStatuses;
  $scope.selectMainTab = routerService.navigateToMainTab;
  $scope.selectStatsTab = routerService.navigateToStatsTab;
  $scope.selectSettingsTab = routerService.navigateToSettingsTab;
  $scope.selectHistoryTab = routerService.navigateToHistoryTab;
  $scope.selectFeedbackTab = routerService.navigateToFeedbackTab;
}]);


oppia.controller('EditorNavbarBreadcrumb', [
    '$scope', 'explorationTitleService', function($scope, explorationTitleService) {
  $scope.navbarTitle = null;
  $scope.$on('explorationPropertyChanged', function() {
    $scope.navbarTitle = explorationTitleService.savedMemento;
  });
}]);


oppia.controller('ExplorationPublishButton', [
    '$scope', '$http', '$rootScope', '$window', '$timeout', '$modal', 'warningsData',
    'changeListService', 'focusService', 'routerService', 'explorationData',
    'explorationRightsService', 'editabilityService', 'explorationWarningsService',
    'previewModeService',
    function(
      $scope, $http, $rootScope, $window, $timeout, $modal, warningsData, changeListService,
      focusService, routerService, explorationData, explorationRightsService,
      editabilityService, explorationWarningsService, previewModeService) {
  // Whether or not a save action is currently in progress.
  $scope.isSaveInProgress = false;
  // Whether or not a discard action is currently in progress.
  $scope.isDiscardInProgress = false;
  // The last 'save' or 'discard' action. Can be null (no such action has been performed
  // yet), 'save' (the last action was a save) or 'discard' (the last action was a
  // discard).
  $scope.lastSaveOrDiscardAction = null;

  $scope.isInPreviewMode = function() {
    return previewModeService.isInPreviewMode();
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
    var confirmDiscard = confirm('Do you want to discard your changes?');
    if (confirmDiscard) {
      warningsData.clear();
      $rootScope.$broadcast('externalSave');

      $scope.isDiscardInProgress = true;
      changeListService.discardAllChanges();
      $rootScope.$broadcast('initExplorationPage', function() {
        // The $apply() is needed to call all the exploration field $watch()
        // methods before flipping isDiscardInProgress.
        $scope.$apply();
        $scope.lastSaveOrDiscardAction = 'discard';
        $scope.isDiscardInProgress = false;
      });
    }
  };

  $scope.getChangeListLength = function() {
    return changeListService.getChangeList().length;
  };

  $scope.isExplorationSaveable = function() {
    return $scope.isExplorationLockedForEditing() && !$scope.isSaveInProgress;
  };

  $window.addEventListener('beforeunload', function(e) {
    if ($scope.isExplorationLockedForEditing()) {
      var confirmationMessage = (
          'You have unsaved changes which will be lost if you leave this page.');
      (e || $window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });

  $scope.saveChanges = function() {
    routerService.savePendingChanges();

    $scope.changeListSummaryUrl = (
      '/createhandler/change_list_summary/' + explorationData.explorationId);

    $http.post($scope.changeListSummaryUrl, {
      change_list: changeListService.getChangeList(),
      version: explorationData.data.version
    }).success(function(data) {
      if (data.error) {
        warningsData.addWarning(data.error);
        return;
      }

      var explorationPropertyChanges = data.summary.exploration_property_changes;
      var statePropertyChanges = data.summary.state_property_changes;
      var changedStates = data.summary.changed_states;
      var addedStates = data.summary.added_states;
      var deletedStates = data.summary.deleted_states;
      var warningMessage = data.warning_message;

      var changesExist = (
        !$.isEmptyObject(explorationPropertyChanges) ||
        !$.isEmptyObject(statePropertyChanges) ||
        changedStates.length > 0 ||
        addedStates.length > 0 ||
        deletedStates.length > 0);

      if (!changesExist) {
        warningsData.addWarning('Your changes cancel each other out, ' +
          'so nothing has been saved.');
        return;
      }

      if (!explorationRightsService.isPrivate() && warningMessage) {
        // If the exploration is not private, warnings should be fixed before
        // it can be saved.
        warningsData.addWarning(warningMessage);
        return;
      }

      warningsData.clear();

      var modalInstance = $modal.open({
        templateUrl: 'modals/saveExploration',
        backdrop: 'static',
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
          commitMessageIsOptional: function() {
            return explorationRightsService.isPrivate();
          }
        },
        controller: [
          '$scope', '$modalInstance', 'explorationPropertyChanges',
          'statePropertyChanges', 'changedStates', 'addedStates',
          'deletedStates', 'commitMessageIsOptional',
          function($scope, $modalInstance, explorationPropertyChanges,
                   statePropertyChanges, changedStates, addedStates,
                   deletedStates, commitMessageIsOptional) {
            $scope.explorationPropertyChanges = explorationPropertyChanges;
            $scope.statePropertyChanges = statePropertyChanges;
            $scope.changedStates = changedStates;
            $scope.addedStates = addedStates;
            $scope.deletedStates = deletedStates;
            $scope.commitMessageIsOptional = commitMessageIsOptional;

            // For reasons of backwards compatibility, the following keys
            // should not be changed.
            // TODO(sll): The keys for this dict already appear in
            // EditorServices.changeListService; consider deduplicating.
            $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES = {
              'title': 'Title',
              'category': 'Category',
              'objective': 'Objective',
              'language_code': 'Language',
              'param_specs': 'Parameter specifications',
              'param_changes': 'Initial parameter changes',
              'default_skin_id': 'Default skin',
              'init_state_name': 'First state'
            };

            // For reasons of backwards compatibility, the following keys
            // should not be changed.
            var EXPLORATION_PROPERTIES_WHICH_ARE_SIMPLE_STRINGS = {
              'title': true,
              'category': true,
              'objective': true,
              'default_skin_id': true,
              'init_state_name': true
            };

            // For reasons of backwards compatibility, the following keys
            // should not be changed.
            $scope.STATE_BACKEND_NAMES_TO_HUMAN_NAMES = {
              'name': 'State name',
              'param_changes': 'Parameter changes',
              'content': 'Content',
              'widget_id': 'Interaction type',
              'widget_customization_args': 'Interaction customizations',
              'widget_sticky': 'Whether to reuse the previous interaction',
              'widget_handlers': 'Reader submission rules'
            }

            // An ordered list of state properties that determines the order in which
            // to show them in the save confirmation modal.
            // For reasons of backwards compatibility, the following keys
            // should not be changed.
            // TODO(sll): Implement this fully. Currently there is no sorting.
            $scope.ORDERED_STATE_PROPERTIES = [
              'name', 'param_changes', 'content', 'widget_id',
              'widget_customization_args', 'widget_sticky', 'widget_handlers'
            ];

            $scope.explorationChangesExist = !$.isEmptyObject(
              $scope.explorationPropertyChanges);
            $scope.stateChangesExist = !$.isEmptyObject(
              $scope.statePropertyChanges);

            $scope._getLongFormPropertyChange = function(humanReadableName, changeInfo) {
              return (
                humanReadableName + ' (from \'' + changeInfo.old_value +
                '\' to \'' + changeInfo.new_value + '\')');
            };

            $scope.formatExplorationPropertyChange = function(propertyName, changeInfo) {
              if (EXPLORATION_PROPERTIES_WHICH_ARE_SIMPLE_STRINGS[propertyName]) {
                return $scope._getLongFormPropertyChange(
                  $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                  changeInfo);
              } else {
                return $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
              }
            };

            $scope.formatStatePropertyChange = function(propertyName, changeInfo) {
              if (propertyName == 'name') {
                return $scope._getLongFormPropertyChange(
                  $scope.STATE_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                  changeInfo);
              } else {
                return $scope.STATE_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
              }
            };

            $scope.formatStateList = function(stateList) {
              return stateList.join('; ');
            };

            $scope.save = function(commitMessage) {
              $modalInstance.close(commitMessage);
            };
            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              warningsData.clear();
            };
          }
        ]
      });

      modalInstance.opened.then(function(data) {
        // The $timeout seems to be needed in order to give the modal time to
        // render.
        $timeout(function() {
          focusService.setFocus('saveChangesModalOpened');
        });
      });

      modalInstance.result.then(function(commitMessage) {
        $scope.isSaveInProgress = true;

        var changeList = changeListService.getChangeList();
        explorationData.save(changeList, commitMessage, function() {
          changeListService.discardAllChanges();
          $rootScope.$broadcast('initExplorationPage');
          $rootScope.$broadcast('refreshVersionHistory', {forceRefresh: true});
          $scope.lastSaveOrDiscardAction = 'save';
          $scope.isSaveInProgress = false;
        }, function() {
          $scope.isSaveInProgress = false;
        });
      });
    });
  };
}]);
