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
 * @fileoverview Controllers and services for the exploration editor page.
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
  'oppiaDatetimeFormatter', 'widgetDefinitionsService', 'newStateTemplateService', 'oppiaPlayerService',
  'explorationStatesService', 'routerService', 'graphDataService',
  function(
    $scope, $http, $modal, $window, $filter, $rootScope,
    $log, $timeout, explorationData, warningsData, activeInputData,
    editorContextService, changeListService, explorationTitleService,
    explorationCategoryService, explorationObjectiveService, explorationLanguageCodeService,
    explorationRightsService, explorationInitStateNameService, validatorsService,
    editabilityService, oppiaDatetimeFormatter, widgetDefinitionsService,
    newStateTemplateService, oppiaPlayerService, explorationStatesService, routerService,
    graphDataService) {

  $scope.isInPreviewMode = false;
  $scope.editabilityService = editabilityService;

  $scope.enterPreviewMode = function() {
    $rootScope.$broadcast('externalSave');
    oppiaPlayerService.populateExploration({
      states: explorationStatesService.getStates(),
      init_state_name: explorationInitStateNameService.savedMemento,
      param_specs: $scope.paramSpecs,
      title: explorationTitleService.savedMemento,
      // TODO(sll): are these actually editable?
      param_changes: []
    });
    $timeout(function() {
      $scope.isInPreviewMode = true;
    });
  };

  $scope.exitPreviewMode = function() {
    $scope.isInPreviewMode = false;
    $timeout(function() {
      routerService.navigateToMainTab(oppiaPlayerService.getCurrentStateName());
      $scope.$broadcast('refreshStateEditor');
    });
  };

  /**********************************************************
   * Called on initial load of the exploration editor page.
   *********************************************************/
  $rootScope.loadingMessage = 'Loading';

  // The pathname should be: .../create/{exploration_id}
  var _pathnameArray = window.location.pathname.split('/');
  $scope.explorationId = _pathnameArray[_pathnameArray.length - 1];
  // The exploration id needs to be attached to the root scope in order for
  // the file picker widget to work. (Note that an alternative approach might
  // also be to replicate this URL-based calculation in the file picker widget.)
  $rootScope.explorationId = $scope.explorationId;
  $scope.explorationUrl = '/create/' + $scope.explorationId;
  $scope.explorationDataUrl = '/createhandler/data/' + $scope.explorationId;
  $scope.explorationDownloadUrl = '/createhandler/download/' + $scope.explorationId;
  $scope.revertExplorationUrl = '/createhandler/revert/' + $scope.explorationId;

  $scope.getTabStatuses = routerService.getTabStatuses;
  $scope.selectMainTab = routerService.navigateToMainTab;
  $scope.selectStatsTab = routerService.navigateToStatsTab;
  $scope.selectSettingsTab = routerService.navigateToSettingsTab;
  $scope.selectHistoryTab = function() {
    // TODO(sll): Do this on-hover rather than on-click.
    $scope.$broadcast('refreshVersionHistory', {forceRefresh: false});
    routerService.navigateToHistoryTab();
  };
  $scope.selectFeedbackTab = routerService.navigateToFeedbackTab;

  /**************************************************
  * Methods affecting the saving of explorations.
  **************************************************/

  // Whether or not a save action is currently in progress.
  $scope.isSaveInProgress = false;
  // Whether or not a discard action is currently in progress.
  $scope.isDiscardInProgress = false;
  // The last 'save' or 'discard' action. Can be null (no such action has been performed
  // yet), 'save' (the last action was a save) or 'discard' (the last action was a
  // discard).
  $scope.lastSaveOrDiscardAction = null;

  $scope.discardChanges = function() {
    var confirmDiscard = confirm('Do you want to discard your changes?');
    if (confirmDiscard) {
      warningsData.clear();
      $rootScope.$broadcast('externalSave');

      $scope.isDiscardInProgress = true;
      changeListService.discardAllChanges();
      $scope.initExplorationPage(function() {
        // The $apply() is needed to call all the exploration field $watch()
        // methods before flipping isDiscardInProgress.
        $scope.$apply();
        $scope.lastSaveOrDiscardAction = 'discard';
        $scope.isDiscardInProgress = false;
      });
    }
  };

  $scope.isExplorationSaveable = function() {
    return $scope.isExplorationLockedForEditing() && !$scope.isSaveInProgress;
  };

  $scope.getChangeListLength = function() {
    return changeListService.getChangeList().length;
  };

  $scope.isExplorationLockedForEditing = function() {
    return changeListService.getChangeList().length > 0;
  };

  $scope.displaySaveReminderWarning = function() {
    warningsData.addWarning('You need to save your changes before continuing.');
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

    $scope.changeListSummaryUrl = '/createhandler/change_list_summary/' + $scope.explorationId;

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

            var EXPLORATION_PROPERTIES_WHICH_ARE_SIMPLE_STRINGS = {
              'title': true,
              'category': true,
              'objective': true,
              'default_skin_id': true,
              'init_state_name': true
            };

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

      modalInstance.result.then(function(commitMessage) {
        $scope.isSaveInProgress = true;

        var changeList = changeListService.getChangeList();
        explorationData.save(changeList, commitMessage, function() {
          changeListService.discardAllChanges();
          $scope.initExplorationPage();
          $scope.$broadcast('refreshVersionHistory', {forceRefresh: true});
          $scope.lastSaveOrDiscardAction = 'save';
          $scope.isSaveInProgress = false;
        }, function() {
          $scope.isSaveInProgress = false;
        });
      });
    });
  };

  /********************************************
  * Methods affecting the graph visualization.
  ********************************************/
  $scope.areExplorationWarningsVisible = false;
  $scope.toggleExplorationWarningVisibility = function() {
    $scope.areExplorationWarningsVisible = !$scope.areExplorationWarningsVisible;
  };

  // Given an initial node name, a list of node names, and a list of edges
  // (each of which is an object with keys 'source' and 'target', and values
  // equal to the respective node names), returns a list of names of all nodes
  // which are unreachable from the initial node.
  $scope._getUnreachableNodeNames = function(initNodeName, nodes, edges) {
    var queue = [initNodeName];
    var seen = {};
    seen[initNodeName] = true;
    while (queue.length > 0) {
      var currNodeName = queue.shift();
      edges.forEach(function(edge) {
        if (edge.source === currNodeName && !seen.hasOwnProperty(edge.target)) {
          seen[edge.target] = true;
          queue.push(edge.target);
        }
      });
    }

    return nodes.filter(function(node) {
      return !seen.hasOwnProperty(node);
    });
  };

  // Given an array of objects with two keys 'source' and 'target', returns
  // an array with the same objects but with the values of 'source' and 'target'
  // switched. (The objects represent edges in a graph, and this operation
  // amounts to reversing all the edges.)
  $scope._getReversedLinks = function(links) {
    return links.map(function(link) {
      return {
        source: link.target,
        target: link.source
      };
    });
  };

  // Returns a list of states which have rules that have no feedback and that
  // point back to the same state.
  $scope._getStatesWithInsufficientFeedback = function() {
    var problematicStates = [];
    var _states = explorationStatesService.getStates();
    for (var stateName in _states) {
      var handlers = _states[stateName].widget.handlers;
      var isProblematic = handlers.some(function(handler) {
        return handler.rule_specs.some(function(ruleSpec) {
          return (
            ruleSpec.dest === stateName &&
            !ruleSpec.feedback.some(function(feedbackItem) {
              return feedbackItem.length > 0;
            })
          );
        });
      });

      if (isProblematic) {
        problematicStates.push(stateName);
      }
    }
    return problematicStates;
  };

  $scope.$on('refreshGraph', function() {
    graphDataService.recompute()
    $scope.updateWarningsList();
  });

  $scope.updateWarningsList = function() {
    graphDataService.recompute();
    $scope.warningsList = [];

    var _graphData = graphDataService.getGraphData();
    if (_graphData) {
      var unreachableStateNames = $scope._getUnreachableNodeNames(
        _graphData.initStateName, _graphData.nodes, _graphData.links);
      if (unreachableStateNames.length) {
        $scope.warningsList.push(
          'The following state(s) are unreachable: ' +
          unreachableStateNames.join(', ') + '.');
      } else {
        // Only perform this check if all states are reachable.
        var deadEndStates = $scope._getUnreachableNodeNames(
          _graphData.finalStateName, _graphData.nodes,
          $scope._getReversedLinks(_graphData.links));
        if (deadEndStates.length) {
          $scope.warningsList.push(
            'The END state is unreachable from: ' + deadEndStates.join(', ') + '.');
        }
      }
    }

    var statesWithInsufficientFeedback = $scope._getStatesWithInsufficientFeedback();
    if (statesWithInsufficientFeedback.length) {
      $scope.warningsList.push(
        'The following states need more feedback: ' +
        statesWithInsufficientFeedback.join(', ') + '.');
    }

    if (!explorationObjectiveService.displayed) {
      $scope.warningsList.push('Please specify an objective (in the Settings tab).');
    }
  };

  $scope.warningsList = [];

  $scope.showEmbedExplorationModal = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/embedExploration',
      backdrop: 'static',
      resolve: {
        explorationId: function() {
          return $scope.explorationId;
        },
        explorationVersion: function() {
          return $scope.currentVersion;
        }
      },
      controller: ['$scope', '$modalInstance', 'explorationId', 'explorationVersion',
        function($scope, $modalInstance, explorationId, explorationVersion) {
          $scope.explorationId = explorationId;
          $scope.serverName = window.location.protocol + '//' + window.location.host;
          $scope.explorationVersion = explorationVersion;

          $scope.close = function() {
            $modalInstance.dismiss('close');
            warningsData.clear();
          };
        }
      ]
    });
  };

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
      widgetDefinitionsService.setInteractiveDefinitions(data.ALL_INTERACTIVE_WIDGETS);
      explorationStatesService.setStates(data.states);

      explorationTitleService.init(data.title);
      explorationCategoryService.init(data.category);
      explorationObjectiveService.init(data.objective);
      explorationLanguageCodeService.init(data.language_code);
      explorationInitStateNameService.init(data.init_state_name);

      $scope.explorationTitleService = explorationTitleService;
      $scope.explorationCategoryService = explorationCategoryService;
      $scope.explorationObjectiveService = explorationObjectiveService;
      $scope.explorationRightsService = explorationRightsService;
      $scope.explorationInitStateNameService = explorationInitStateNameService;

      $scope.currentUserIsAdmin = data.is_admin;
      $scope.currentUserIsModerator = data.is_moderator;
      $scope.defaultSkinId = data.default_skin_id;
      $scope.allSkinIds = data.all_skin_ids;

      $scope.paramSpecs = data.param_specs || {};

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

      $scope.updateWarningsList();

      $rootScope.loadingMessage = '';

      $scope.$broadcast('refreshStatisticsTab');

      if (explorationStatesService.getState(editorContextService.getActiveStateName())) {
        $scope.$broadcast('refreshStateEditor');
      }

      $scope.refreshFeedbackTabHeader();

      if (successCallback) {
        successCallback();
      }
    });
  };

  $scope.initExplorationPage();


  $scope.addExplorationParamSpec = function(name, type, successCallback) {
    $log.info('Adding a param spec to the exploration.');
    if (name in $scope.paramSpecs) {
      warningsData.addWarning(
        'Parameter ' + name + ' already exists, so it was not added.');
      return;
    }

    var oldParamSpecs = angular.copy($scope.paramSpecs);
    $scope.paramSpecs[name] = {obj_type: type};
    changeListService.editExplorationProperty(
      'param_specs', angular.copy($scope.paramSpecs), oldParamSpecs);
  };

  $scope.showPublishExplorationModal = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/publishExploration',
      backdrop: 'static',
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

  $scope.showNominateExplorationModal = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/nominateExploration',
      backdrop: 'static',
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.close = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    });
  };

  $scope.feedbackTabHeader = 'Feedback';
  $scope.feedbackLastUpdatedUrl = (
    '/feedback_last_updated/' + $scope.explorationId);
  $scope.refreshFeedbackTabHeader = function() {
    $scope.feedbackTabHeader = 'Feedback (loading...)';
    $http.get($scope.feedbackLastUpdatedUrl).then(function(response) {
      var data = response.data;
      if (data.last_updated) {
        $scope.feedbackTabHeader = (
          'Feedback (updated ' +
          oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(data.last_updated) +
          ')');
      } else {
        $scope.feedbackTabHeader = 'Feedback';
      }
    });
  };

  // Constants and methods relating to the state editor tutorial.
  $scope.EDITOR_TUTORIAL_OPTIONS = {
    disableInteraction: true,
    doneLabel: 'Let\'s go!',
    exitOnEsc: true,
    exitOnOverlayClick: true,
    keyboardNavigation: true,
    scrollToElement: true,
    showStepNumbers: false,
    skipLabel: 'Exit',
    tooltipClass: 'oppia-tutorial-tooltip',
    steps: [{
      intro: (
        'Welcome to the Oppia editor tutorial!<br><br>' +
        'Oppia explorations mimic one-on-one conversations which are ' +
        'divided into \'states\'. A state consists of something you say, ' +
        'followed by the learner\'s response. Based on the response, ' +
        'you would decide what to say next (as you would in real life if you ' +
        'were having a conversation with a student).')
    }, {
      element: '#tutorialStateContent',
      intro: (
        'The \'content\' section is where you type what you want to tell the ' +
        'learner.<br><br>' +
        'For example, you might give some context behind a problem ' +
        '(<em>Jane bought a new alarm clock with a 12-hour display. It now shows ' +
        '12.45 pm and she wants to leave the house for lunch in half an hour</em>) ' +
        'and then ask a question (<em>What time should she set the alarm to?</em>).')
    }, {
      element: '#tutorialStateInteraction',
      intro: (
        'The \'interaction\' section allows you to choose how the learner ' +
        'responds. You can edit details of the interaction by clicking on it.<br><br>' +
        'In this case, you might want them to type a string of text ' +
        'giving the desired time, such as "1:15" -- so you might choose a ' +
        '"Text input" interaction and set its placeholder text to "Type the time here."')
    }, {
      element: '#tutorialStateRules',
      intro: (
        'The \'rules\' section allows you to choose what you want to do next ' +
        'based on the learner\'s response. A reasonable rule of thumb is to try ' +
        'and write down what you would say to a student in real life.<br><br>' +
        'For example, if the learner types "1:15", you might want to send them on ' +
        'to a new state that congratulates them on solving the problem and ' +
        'poses a follow-up question. You can also tackle specific misconceptions -- ' +
        'for example, if the learner types "13:15" you could give them more specific ' +
        'feedback (<em>Jane tries to set the alarm to "13:15", but the display shows ' +
        'an error. She then remembers that there is no \'13\' on a 12-hour clock. ' +
        'Try again?</em>)')
    }, {
      element: '#tutorialExplorationGraph',
      intro: (
        'The exploration graph shows how your states relate to one another. You can ' +
        'click the button in the top-right to see a larger version, and click ' +
        'on individual states to navigate to them.<br><br>' +
        'That\'s the end of the tutorial! Click \'Done\' to close this tooltip, ' +
        'then you can start creating an exploration by clicking on the \'Content\' ' +
        'section.'
      )
    }]
  };

  $scope._actuallyStartTutorial = function() {
    var intro = introJs();
    intro.setOptions($scope.EDITOR_TUTORIAL_OPTIONS);
    intro.onexit(function() {
      editabilityService.onEndTutorial();
      $scope.$apply();
    });
    intro.oncomplete(function() {
      editabilityService.onEndTutorial();
      $scope.$apply();
    });

    editabilityService.onStartTutorial();
    intro.start();
  };

  $scope.startTutorial = function() {
    if ($scope.isInPreviewMode) {
      $scope.exitPreviewMode();
      $timeout(function() {
        $scope._actuallyStartTutorial();
      });
    } else {
      routerService.navigateToMainTab();
      $scope._actuallyStartTutorial();
    }
  };

  $scope.$on('openEditorTutorial', $scope.startTutorial);
}]);
