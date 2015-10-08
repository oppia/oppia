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

// The conditioning on window.GLOBALS is because Karma does not appear to see GLOBALS.
oppia.constant('INTERACTION_SPECS', window.GLOBALS ? GLOBALS.INTERACTION_SPECS : {});
oppia.constant('GADGET_SPECS', window.GLOBALS ? GLOBALS.GADGET_SPECS : {});
oppia.constant('SKIN_SPECS', window.GLOBALS ? GLOBALS.SKIN_SPECS: {});

oppia.controller('ExplorationEditor', [
  '$scope', '$http', '$window', '$rootScope', '$log', '$timeout',
  'explorationData', 'editorContextService', 'explorationTitleService',
  'explorationCategoryService', 'explorationGadgetsService',
  'explorationObjectiveService', 'explorationLanguageCodeService',
  'explorationRightsService', 'explorationSkinIdService',
  'explorationInitStateNameService', 'explorationTagsService',
  'editabilityService', 'explorationStatesService', 'routerService',
  'graphDataService', 'stateEditorTutorialFirstTimeService',
  'explorationParamSpecsService', 'explorationParamChangesService',
  'explorationWarningsService', '$templateCache', 'explorationContextService',
  function(
    $scope, $http, $window, $rootScope, $log, $timeout,
    explorationData,  editorContextService, explorationTitleService,
    explorationCategoryService, explorationGadgetsService,
    explorationObjectiveService, explorationLanguageCodeService,
    explorationRightsService, explorationSkinIdService,
    explorationInitStateNameService, explorationTagsService,
    editabilityService, explorationStatesService, routerService,
    graphDataService,  stateEditorTutorialFirstTimeService,
    explorationParamSpecsService, explorationParamChangesService,
    explorationWarningsService, $templateCache, explorationContextService) {

  $scope.editabilityService = editabilityService;
  $scope.editorContextService = editorContextService;

  /**********************************************************
   * Called on initial load of the exploration editor page.
   *********************************************************/
  $rootScope.loadingMessage = 'Loading';

  $scope.explorationId = explorationContextService.getExplorationId();
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

  $scope.getExplorationUrl = function(explorationId) {
    return explorationId ? ('/explore/' + explorationId) : '';
  };

  // Initializes the exploration page using data from the backend. Called on
  // page load.
  $scope.initExplorationPage = function(successCallback) {
    explorationData.getData().then(function(data) {
      explorationStatesService.init(data.states);

      explorationTitleService.init(data.title);
      explorationSkinIdService.init(data.default_skin_id);
      explorationCategoryService.init(data.category);
      explorationGadgetsService.init(data.skin_customizations);
      explorationObjectiveService.init(data.objective);
      explorationLanguageCodeService.init(data.language_code);
      explorationInitStateNameService.init(data.init_state_name);
      explorationTagsService.init(data.tags);
      explorationParamSpecsService.init(data.param_specs);
      explorationParamChangesService.init(data.param_changes || []);

      $scope.explorationTitleService = explorationTitleService;
      $scope.explorationSkinIdService = explorationSkinIdService;
      $scope.explorationCategoryService = explorationCategoryService;
      $scope.explorationGadgetsService = explorationGadgetsService;
      $scope.explorationObjectiveService = explorationObjectiveService;
      $scope.explorationRightsService = explorationRightsService;
      $scope.explorationInitStateNameService = explorationInitStateNameService;

      $scope.currentUserIsAdmin = data.is_admin;
      $scope.currentUserIsModerator = data.is_moderator;

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

  var _ID_TUTORIAL_STATE_CONTENT = '#tutorialStateContent';
  var _ID_TUTORIAL_STATE_INTERACTION = '#tutorialStateInteraction';
  var _ID_TUTORIAL_PREVIEW_TAB = "#tutorialPreviewTab";
  var _ID_TUTORIAL_SAVE_BUTTON = "#tutorialSaveButton";

  $scope.EDITOR_TUTORIAL_OPTIONS = [{
    type: 'title',
    heading: 'Tutorial',
    text: (
      'Creating an Oppia exploration is easy! ' +
      'Click \'Next\' to learn how to use the exploration editor.<br><br> ' +
      'You might also find these resources helpful for creating your exploration: ' +
      '<ul>'+
      '<li><a href="https://oppia.github.io/#/AWorkedExample" target="_blank">' +
      '        Walkthrough of the Oppia Editor' +
      '</a></li>' +
      '<li><a href="https://oppia.github.io/#/PlanningAnExploration" target="_blank">' +
      '        Planning Your Exploration' +
      '</a></li>' +
      '<li><a href="https://oppia.github.io/#/DesignTips" target="_blank">' +
      '        Exploration Design Tips' +
      '</li>' +
      '</ul>')
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
      'An Oppia exploration is a conversation between a tutor and a ' +
      'learner that is divided into several \'cards\'.<br><br>' +
      'The first part of a card is the <b>content</b>. Here, you can set ' +
      'the scene and ask the learner a question.'),
    placement: 'right'
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
    heading: 'Interaction',
    text: (
      'After telling Oppia what to say, choose how you want the learner to respond by ' +
      'selecting an <b>interaction type</b>.' +
      'Then, based on the learner\'s response, you can tell Oppia how to reply by ' +
      'creating a <b>response</b>.')
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
    selector: _ID_TUTORIAL_PREVIEW_TAB,
    heading: 'Preview',
    text: (
      'At any time, you can click the preview button to play through ' +
      'your exploration.'),
    placement: 'bottom'
  }, {
    type: 'element',
    selector: _ID_TUTORIAL_SAVE_BUTTON,
    heading: 'Save',
    text: (
      'When you\'re done making changes, ' +
      'be sure to save your work.<br><br>' +
      'That\'s the end of the tour! If you run into any issues, feel free to post in the site forum.'),
    placement: 'bottom'
  }];

  // Replace the ng-joyride template with one that uses <[...]> interpolators instead of
  // {{...}} interpolators.
  var ngJoyrideTemplate = $templateCache.get('ng-joyride-title-tplv1.html');
  ngJoyrideTemplate = ngJoyrideTemplate.replace(/\{\{/g, '<[').replace(/\}\}/g, ']>');
  $templateCache.put('ng-joyride-title-tplv1.html', ngJoyrideTemplate);

  $scope.onLeaveTutorial = function() {
    editabilityService.onEndTutorial();
    $scope.$apply();
    stateEditorTutorialFirstTimeService.markTutorialFinished();
    $scope.tutorialInProgress = false;
  };

  $scope.tutorialInProgress = false;
  $scope.startTutorial = function(firstTime) {
    routerService.navigateToMainTab();

    // The $timeout wrapper is needed for all components on the page to load,
    // otherwise elements within ng-if's are not guaranteed to be present on
    // the page.
    $timeout(function() {
      editabilityService.onStartTutorial();
      $scope.tutorialInProgress = true;
    });
  };

  $scope.$on('openEditorTutorial', $scope.startTutorial);
}]);


oppia.controller('EditorNavigation', [
    '$scope', '$rootScope', '$timeout', 'routerService', 'explorationRightsService',
    'explorationWarningsService',
    function(
      $scope, $rootScope, $timeout, routerService, explorationRightsService,
      explorationWarningsService) {
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
}]);


oppia.controller('EditorNavbarBreadcrumb', [
    '$scope', 'explorationTitleService', 'routerService',
    function($scope, explorationTitleService, routerService) {
  $scope.navbarTitle = null;
  $scope.$on('explorationPropertyChanged', function() {
    var _MAX_TITLE_LENGTH = 20;
    $scope.navbarTitle = explorationTitleService.savedMemento;
    if ($scope.navbarTitle.length > _MAX_TITLE_LENGTH) {
      $scope.navbarTitle = $scope.navbarTitle.substring(0, _MAX_TITLE_LENGTH - 3) + '...';
    }
  });

  var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
    'main': 'Edit',
    'preview': 'Preview',
    'settings': 'Settings',
    'stats': 'Statistics',
    'history': 'History',
    'feedback': 'Feedback'
  };

  $scope.getCurrentTabName = function() {
    if (!routerService.getTabStatuses()) {
      return '';
    } else {
      return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[
        routerService.getTabStatuses().active];
    }
  };
}]);


oppia.controller('ExplorationSaveAndPublishButtons', [
    '$scope', '$http', '$rootScope', '$window', '$timeout', '$modal', 'warningsData',
    'changeListService', 'focusService', 'routerService', 'explorationData',
    'explorationRightsService', 'editabilityService', 'explorationWarningsService',
    function(
      $scope, $http, $rootScope, $window, $timeout, $modal, warningsData, changeListService,
      focusService, routerService, explorationData, explorationRightsService,
      editabilityService, explorationWarningsService) {
  // Whether or not a save action is currently in progress.
  $scope.isSaveInProgress = false;
  // Whether or not a discard action is currently in progress.
  $scope.isDiscardInProgress = false;
  // The last 'save' or 'discard' action. Can be null (no such action has been performed
  // yet), 'save' (the last action was a save) or 'discard' (the last action was a
  // discard).
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
    return (
      $scope.isExplorationLockedForEditing() &&
      !$scope.isSaveInProgress && (
        ($scope.isPrivate() && !explorationWarningsService.hasCriticalWarnings()) ||
        (!$scope.isPrivate() && explorationWarningsService.countWarnings() === 0)
      )
    );
  };

  $window.addEventListener('beforeunload', function(e) {
    if ($scope.isExplorationLockedForEditing()) {
      var confirmationMessage = (
          'You have unsaved changes which will be lost if you leave this page.');
      (e || $window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });

  $scope.isPublic = function() {
    return explorationRightsService.isPublic();
  };

  $scope.showPublishExplorationModal = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/publishExploration',
      backdrop: true,
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.publish = $modalInstance.close;

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function() {
      explorationRightsService.saveChangeToBackend({is_public: true});
    });
  };

  $scope.getPublishExplorationButtonTooltip = function() {
    if (explorationWarningsService.countWarnings() > 0) {
      return 'Please resolve the warnings before publishing.';
    } else if ($scope.isExplorationLockedForEditing()) {
      return 'Please save your changes before publishing.';
    } else {
      return 'Publish to Gallery';
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

  // This flag is used to ensure only one save exploration modal can be open at
  // any one time.
  var _modalIsOpen = false;

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
            $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES = {
              'title': 'Title',
              'category': 'Category',
              'objective': 'Objective',
              'language_code': 'Language',
              'tags': 'Tags',
              'param_specs': 'Parameter specifications',
              'param_changes': 'Initial parameter changes',
              'default_skin_id': 'Default skin',
              'init_state_name': 'First card'
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
              'name': 'Card name',
              'param_changes': 'Parameter changes',
              'content': 'Content',
              'widget_id': 'Interaction type',
              'widget_customization_args': 'Interaction customizations',
              'answer_groups': 'Responses',
              'default_outcome': 'Default outcome',
              'confirmed_unclassified_answers': 'Confirmed unclassified answers'
            }

            // For reasons of backwards compatibility, the following keys
            // should not be changed.
            $scope.GADGET_BACKEND_NAMES_TO_HUMAN_NAMES = {
              'name': 'Gadget name',
              'gadget_visibility': 'Gadget visibility between states',
              'gadget_customization_args': 'Gadget customizations'
            }

            // An ordered list of state properties that determines the order in which
            // to show them in the save confirmation modal.
            // For reasons of backwards compatibility, the following keys
            // should not be changed.
            // TODO(sll): Implement this fully. Currently there is no sorting.
            $scope.ORDERED_STATE_PROPERTIES = [
              'name', 'param_changes', 'content', 'widget_id',
              'widget_customization_args', 'answer_groups', 'default_outcome'
            ];

            $scope.explorationChangesExist = !$.isEmptyObject(
              $scope.explorationPropertyChanges);
            $scope.stateChangesExist = !$.isEmptyObject(
              $scope.statePropertyChanges);
            $scope.gadgetChangesExist = !$.isEmptyObject(
              $scope.gadgetPropertyChanges);

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

            $scope.formatGadgetPropertyChange = function(
                propertyName, changeInfo) {
              if (propertyName == 'name') {
                return $scope._getLongFormPropertyChange(
                  $scope.GADGET_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                  changeInfo);
              } else {
                return $scope.GADGET_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
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
              warningsData.clear();
            };
          }
        ]
      });

      // Modal is Opened
      _modalIsOpen = true;

      modalInstance.opened.then(function(data) {
        // The $timeout seems to be needed in order to give the modal time to
        // render.
        $timeout(function() {
          focusService.setFocus('saveChangesModalOpened');
        });
      });

      modalInstance.result.then(function(commitMessage) {
        $scope.isSaveInProgress = true;
        _modalIsOpen = false;

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
      }, function() {
        _modalIsOpen = false;
      });
    });
  };
}]);
