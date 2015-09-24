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
 * @fileoverview Controllers for a state's interaction editor.
 *
 * @author sll@google.com (Sean Lip)
 */

var DEFAULT_TERMINAL_STATE_CONTENT = 'Congratulations, you have finished!';

// A state-specific cache for interaction details. It stores customization args
// corresponding to an interaction id so that they can be restored if the
// interaction is changed back while the user is still in this state. This
// cache should be reset each time the state editor is initialized.
oppia.factory('interactionDetailsCache', [function() {
  var _cache = {};
  return {
    reset: function() {
      _cache = {};
    },
    contains: function(interactionId) {
      return _cache.hasOwnProperty(interactionId);
    },
    set: function(interactionId, interactionCustomizationArgs) {
      _cache[interactionId] = {
        customization: angular.copy(interactionCustomizationArgs)
      };
    },
    get: function(interactionId) {
      if (!_cache.hasOwnProperty(interactionId)) {
        return null;
      }
      return angular.copy(_cache[interactionId]);
    }
  };
}]);


oppia.controller('StateInteraction', [
    '$scope', '$http', '$rootScope', '$modal', '$filter', 'warningsData',
    'editorContextService', 'changeListService', 'oppiaHtmlEscaper',
    'INTERACTION_SPECS', 'stateInteractionIdService',
    'stateCustomizationArgsService', 'editabilityService',
    'explorationStatesService', 'graphDataService',
    'interactionDetailsCache', 'oppiaExplorationHtmlFormatterService',
    function($scope, $http, $rootScope, $modal, $filter, warningsData,
      editorContextService, changeListService, oppiaHtmlEscaper,
      INTERACTION_SPECS, stateInteractionIdService,
      stateCustomizationArgsService, editabilityService,
      explorationStatesService, graphDataService,
      interactionDetailsCache, oppiaExplorationHtmlFormatterService) {

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the
  // interaction preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.stateInteractionIdService = stateInteractionIdService;

  $scope.hasLoaded = false;

  $scope.getCurrentInteractionName = function() {
    return (
      stateInteractionIdService.savedMemento ?
      INTERACTION_SPECS[stateInteractionIdService.savedMemento].name : '');
  };

  $scope.doesCurrentInteractionHaveCustomizations = function() {
    var interactionSpec = INTERACTION_SPECS[
      stateInteractionIdService.savedMemento];
    return (
      interactionSpec && interactionSpec.customization_arg_specs.length > 0);
  };

  var _getInteractionPreviewTag = function(interactionCustomizationArgs) {
    if (!stateInteractionIdService.savedMemento) {
      return '';
    }
    return oppiaExplorationHtmlFormatterService.getInteractionHtml(
      stateInteractionIdService.savedMemento, interactionCustomizationArgs);
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.hasLoaded = false;

    interactionDetailsCache.reset();

    $scope.stateName = editorContextService.getActiveStateName();

    stateInteractionIdService.init(
      $scope.stateName, stateData.interaction.id,
      stateData.interaction, 'widget_id');
    stateCustomizationArgsService.init(
      $scope.stateName, stateData.interaction.customization_args,
      stateData.interaction, 'widget_customization_args');

    $rootScope.$broadcast('initializeAnswerGroups', {
      'interactionId': stateData.interaction.id,
      'answerGroups': stateData.interaction.answer_groups,
      'defaultOutcome': stateData.interaction.default_outcome,
      'confirmedUnclassifiedAnswers': (
        stateData.interaction.confirmed_unclassified_answers)
    });

    _updateInteractionPreviewAndAnswerChoices();
    $scope.hasLoaded = true;
  });

  // If a terminal interaction is selected for a state and it currently has no
  // content, this function sets the content to DEFAULT_TERMINAL_STATE_CONTENT.
  // NOTE TO DEVELOPERS: Callers of this function must ensure that the current
  // active state is a terminal one.
  var updateDefaultTerminalStateContentIfEmpty = function() {
    // Get current state.
    var activeStateName = editorContextService.getActiveStateName();
    var state = explorationStatesService.getState(activeStateName);

    // Check if the content is currently empty, as expected.
    if (state.content.length != 1
        || state.content[0].value !== ''
        || state.content[0].type != 'text') {
      return;
    }

    // Update the state's content.
    var previousContent = angular.copy(state.content);
    state.content = [{type: 'text', value: DEFAULT_TERMINAL_STATE_CONTENT}];

    // Fire property change for editing the state's content.
    changeListService.editStateProperty(
      activeStateName, 'content',
      angular.copy(state.content), previousContent);

    // Save state.
    explorationStatesService.setState(activeStateName, state);
  };

  $scope.onCustomizationModalSavePostHook = function(unusedResult) {
    var hasInteractionIdChanged = (
      stateInteractionIdService.displayed !==
      stateInteractionIdService.savedMemento);
    if (hasInteractionIdChanged) {
      stateInteractionIdService.saveDisplayedValue();
      if (INTERACTION_SPECS[stateInteractionIdService.displayed].is_terminal) {
        updateDefaultTerminalStateContentIfEmpty();
      }
    }

    stateCustomizationArgsService.saveDisplayedValue();

    interactionDetailsCache.set(
      stateInteractionIdService.savedMemento,
      stateCustomizationArgsService.savedMemento);

    // This must be called here so that the rules are updated before the state
    // graph is recomputed.
    if (hasInteractionIdChanged) {
      $rootScope.$broadcast(
        'onInteractionIdChanged', stateInteractionIdService.savedMemento);
    }

    _updateStatesDict();
    graphDataService.recompute();
    _updateInteractionPreviewAndAnswerChoices();

    // Refresh some related elements so the updated state appears (if its
    // content has been changed).
    $rootScope.$broadcast('refreshStateEditor');
  };

  $scope.openInteractionCustomizerModal = function() {
    if (editabilityService.isEditable()) {
      warningsData.clear();

      $modal.open({
        templateUrl: 'modals/customizeInteraction',
        // Clicking outside this modal should not dismiss it.
        backdrop: 'static',
        resolve: {},
        controller: [
            '$scope', '$modalInstance', 'stateInteractionIdService', 'stateCustomizationArgsService', 'interactionDetailsCache', 'INTERACTION_SPECS',
            function($scope, $modalInstance, stateInteractionIdService, stateCustomizationArgsService, interactionDetailsCache, INTERACTION_SPECS) {
          // This binds the services to the HTML template, so that their
          // displayed values can be used in the HTML.
          $scope.stateInteractionIdService = stateInteractionIdService;
          $scope.stateCustomizationArgsService = stateCustomizationArgsService;

          $scope.INTERACTION_SPECS = INTERACTION_SPECS;
          $scope.ALLOWED_INTERACTION_CATEGORIES = GLOBALS.ALLOWED_INTERACTION_CATEGORIES;

          if (stateInteractionIdService.savedMemento) {
            var interactionSpec = INTERACTION_SPECS[stateInteractionIdService.savedMemento];
            $scope.customizationArgSpecs = interactionSpec.customization_arg_specs;

            stateInteractionIdService.displayed = angular.copy(
              stateInteractionIdService.savedMemento);
            stateCustomizationArgsService.displayed = {};
            // Ensure that stateCustomizationArgsService.displayed is fully
            // populated.
            for (var i = 0; i < $scope.customizationArgSpecs.length; i++) {
              var argName = $scope.customizationArgSpecs[i].name;
              stateCustomizationArgsService.displayed[argName] = {
                value: (
                  stateCustomizationArgsService.savedMemento.hasOwnProperty(argName) ?
                  angular.copy(stateCustomizationArgsService.savedMemento[argName].value) :
                  angular.copy($scope.customizationArgSpecs[i].default_value)
                )
              };
            }

            $scope.$broadcast('schemaBasedFormsShown');
            $scope.form = {};
          }

          $scope.onChangeInteractionId = function(newInteractionId) {
            var interactionSpec = INTERACTION_SPECS[newInteractionId];
            $scope.customizationArgSpecs = interactionSpec.customization_arg_specs;

            stateInteractionIdService.displayed = newInteractionId;
            stateCustomizationArgsService.displayed = {};
            if (interactionDetailsCache.contains(newInteractionId)) {
              stateCustomizationArgsService.displayed = interactionDetailsCache.get(
                newInteractionId).customization;
            } else {
              for (var i = 0; i < $scope.customizationArgSpecs.length; i++) {
                var argName = $scope.customizationArgSpecs[i].name;
                stateCustomizationArgsService.displayed[argName] = {
                  value: angular.copy($scope.customizationArgSpecs[i].default_value)
                };
              }
            }

            $scope.$broadcast('schemaBasedFormsShown');
            $scope.form = {};
          };

          $scope.returnToInteractionSelector = function() {
            interactionDetailsCache.set(
              stateInteractionIdService.displayed,
              stateCustomizationArgsService.displayed);

            stateInteractionIdService.displayed = null;
            stateCustomizationArgsService.displayed = {};
          };

          $scope.save = function() {
            $modalInstance.close();
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        }]
      }).result.then($scope.onCustomizationModalSavePostHook, function() {
        stateInteractionIdService.restoreFromMemento();
        stateCustomizationArgsService.restoreFromMemento();
      });
    }
  };

  $scope.deleteInteraction = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/deleteInteraction',
      backdrop: true,
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.reallyDelete = function() {
          $modalInstance.close();
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    }).result.then(function() {
      stateInteractionIdService.displayed = null;
      stateCustomizationArgsService.displayed = {};

      stateInteractionIdService.saveDisplayedValue();
      stateCustomizationArgsService.saveDisplayedValue();
      $rootScope.$broadcast('onInteractionIdChanged', stateInteractionIdService.savedMemento);
      _updateStatesDict();
      graphDataService.recompute();
      _updateInteractionPreviewAndAnswerChoices();
    });
  };

  var _updateInteractionPreviewAndAnswerChoices = function() {
    $scope.interactionId = stateInteractionIdService.savedMemento;

    var currentCustomizationArgs = stateCustomizationArgsService.savedMemento;
    $scope.interactionPreviewHtml = _getInteractionPreviewTag(currentCustomizationArgs);

    // Special cases for multiple choice input and image click input.
    if ($scope.interactionId === 'MultipleChoiceInput') {
      $rootScope.$broadcast(
        'updateAnswerChoices', currentCustomizationArgs['choices'].value.map(function(val, ind) {
          return {
            val: ind,
            label: val
          };
        })
      );
    } else if ($scope.interactionId === 'ImageClickInput') {
      var _answerChoices = [];
      var imageWithRegions = currentCustomizationArgs['imageAndRegions'].value;
      for (var j = 0; j < imageWithRegions.labeledRegions.length; j++) {
        _answerChoices.push({
          val: imageWithRegions.labeledRegions[j].label,
          label: imageWithRegions.labeledRegions[j].label
        });
      }

      $rootScope.$broadcast('updateAnswerChoices', _answerChoices);
    } else if ($scope.interactionId === 'ItemSelectionInput') {
      $rootScope.$broadcast(
        'updateAnswerChoices', currentCustomizationArgs['choices'].value.map(function(val, ind) {
          return {
            val: val,
            label: val
          };
        })
      );
    } else {
      $rootScope.$broadcast('updateAnswerChoices', null);
    }
  };

  var _updateStatesDict = function() {
    var activeStateName = editorContextService.getActiveStateName();
    var _stateDict = explorationStatesService.getState(activeStateName);
    _stateDict.interaction.id = angular.copy(
      stateInteractionIdService.savedMemento);
    _stateDict.interaction.customization_args = angular.copy(
      stateCustomizationArgsService.savedMemento);
    explorationStatesService.setState(activeStateName, _stateDict);
  };
}]);

oppia.directive('testInteractionPanel', [function() {
  return {
    restrict: 'E',
    scope: {
      stateContent: '&',
      inputTemplate: '&',
      onSubmitAnswer: '&'
    },
    templateUrl: 'teaching/testInteractionPanel',
    controller: [
      '$scope', 'editorContextService', 'explorationStatesService',
      'INTERACTION_SPECS', 'INTERACTION_DISPLAY_MODE_INLINE',
      function($scope, editorContextService, explorationStatesService,
          INTERACTION_SPECS, INTERACTION_DISPLAY_MODE_INLINE) {
        var _stateName = editorContextService.getActiveStateName();
        var _state = explorationStatesService.getState(_stateName);
        $scope.interactionIsInline = (
          INTERACTION_SPECS[_state.interaction.id].display_mode ===
          INTERACTION_DISPLAY_MODE_INLINE);
        $scope.submitAnswer = function(answer) {
          $scope.onSubmitAnswer({answer: answer});
        };
      }
    ]
  };
}]);
