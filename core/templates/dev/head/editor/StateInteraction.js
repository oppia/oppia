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
    'editorContextService', 'oppiaHtmlEscaper', 'INTERACTION_SPECS',
    'stateInteractionIdService', 'stateCustomizationArgsService',
    'editabilityService', 'explorationStatesService', 'graphDataService',
    'interactionDetailsCache',
    function($scope, $http, $rootScope, $modal, $filter, warningsData,
      editorContextService, oppiaHtmlEscaper, INTERACTION_SPECS,
      stateInteractionIdService, stateCustomizationArgsService,
      editabilityService, explorationStatesService, graphDataService,
      interactionDetailsCache) {

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the
  // interaction preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.stateInteractionIdService = stateInteractionIdService;

  $scope.hasLoaded = false;

  $scope.doesCurrentInteractionHaveCustomizations = function() {
    var interactionSpec = INTERACTION_SPECS[stateInteractionIdService.savedMemento];
    return interactionSpec && interactionSpec.customization_arg_specs.length > 0;
  };

  var _getStateCustomizationArgsFromInteractionCustomizationArgs = function(interactionCustomizationArgs) {
    var result = {};
    for (var i = 0; i < interactionCustomizationArgs.length; i++) {
      result[interactionCustomizationArgs[i].name] = {
        value: angular.copy(interactionCustomizationArgs[i].value)
      };
    }
    return result;
  };

  var _getInteractionPreviewTag = function(interactionCustomizationArgs) {
    if (!stateInteractionIdService.savedMemento) {
      return '';
    }

    var el = $(
      '<oppia-interactive-' +
      $filter('camelCaseToHyphens')(stateInteractionIdService.savedMemento) + '/>');
    for (var caName in interactionCustomizationArgs) {
      el.attr(
        $filter('camelCaseToHyphens')(caName) + '-with-value',
        oppiaHtmlEscaper.objToEscapedJson(interactionCustomizationArgs[caName].value));
    }
    return el.get(0).outerHTML;
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

    $rootScope.$broadcast('initializeHandlers', {
      'interactionId': stateData.interaction.id,
      'handlers': stateData.interaction.handlers
    });

    _updateInteractionPreviewAndAnswerChoices();
    $scope.hasLoaded = true;
  });

  $scope.openInteractionCustomizerModal = function() {
    if (editabilityService.isEditable()) {
      warningsData.clear();

      $modal.open({
        templateUrl: 'modals/customizeInteraction',
        backdrop: true,
        resolve: {},
        controller: [
            '$scope', '$modalInstance', 'stateInteractionIdService', 'stateCustomizationArgsService', 'interactionDetailsCache', 'INTERACTION_SPECS',
            function($scope, $modalInstance, stateInteractionIdService, stateCustomizationArgsService, interactionDetailsCache, INTERACTION_SPECS) {
          $scope.stateInteractionIdService = stateInteractionIdService;
          $scope.INTERACTION_SPECS = INTERACTION_SPECS;

          if (stateInteractionIdService.savedMemento) {
            var interactionSpec = INTERACTION_SPECS[stateInteractionIdService.savedMemento];

            $scope.tmpCustomizationArgs = [];
            for (var i = 0; i < interactionSpec.customization_arg_specs.length; i++) {
              var caName = interactionSpec.customization_arg_specs[i].name;
              $scope.tmpCustomizationArgs.push({
                name: caName,
                value: (
                  stateCustomizationArgsService.displayed.hasOwnProperty(caName) ?
                  angular.copy(stateCustomizationArgsService.displayed[caName].value) :
                  angular.copy(interactionSpec.customization_arg_specs[i].default_value)
                )
              });
            }

            $scope.$broadcast('schemaBasedFormsShown');
            $scope.customizationArgSpecs = interactionSpec.customization_arg_specs;
            $scope.form = {};
          }

          $scope.onChangeInteractionId = function(newInteractionId) {
            stateInteractionIdService.displayed = newInteractionId;

            if (interactionDetailsCache.contains(newInteractionId)) {
              var _cachedCustomization = interactionDetailsCache.get(newInteractionId);
              stateCustomizationArgsService.displayed = _cachedCustomization.customization;
            } else {
              var interactionSpec = INTERACTION_SPECS[newInteractionId];

              $scope.tmpCustomizationArgs = [];
              for (var i = 0; i < interactionSpec.customization_arg_specs.length; i++) {
                var caName = interactionSpec.customization_arg_specs[i].name;
                $scope.tmpCustomizationArgs.push({
                  name: caName,
                  value: angular.copy(interactionSpec.customization_arg_specs[i].default_value)
                });
              }
            }

            $scope.$broadcast('schemaBasedFormsShown');
            $scope.customizationArgSpecs = interactionSpec.customization_arg_specs;
            $scope.form = {};
          };

          $scope.save = function() {
            stateInteractionIdService.saveDisplayedValue();
            $modalInstance.close($scope.tmpCustomizationArgs);
          };

          $scope.cancel = function() {
            stateInteractionIdService.restoreFromMemento();
            stateCustomizationArgsService.restoreFromMemento();
            $modalInstance.dismiss('cancel');
          };
        }]
      }).result.then(function(tmpCustomizationArgs) {
        stateCustomizationArgsService.displayed = _getStateCustomizationArgsFromInteractionCustomizationArgs(
          tmpCustomizationArgs);
        stateCustomizationArgsService.saveDisplayedValue();

        interactionDetailsCache.set(
          stateInteractionIdService.savedMemento,
          stateCustomizationArgsService.savedMemento);

        // This must be called here so that the rules are updated before the state
        // graph is recomputed.
        $rootScope.$broadcast('onInteractionIdChanged', stateInteractionIdService.savedMemento);
        _updateStatesDict();
        graphDataService.recompute();
        _updateInteractionPreviewAndAnswerChoices();
      });
    }
  };

  $scope.deleteInteraction = function() {
    if (!window.confirm('Are you sure you want to delete this interaction? This will also clear all its rules.')) {
      return false;
    }

    stateInteractionIdService.displayed = null;
    stateCustomizationArgsService.displayed = {};

    stateInteractionIdService.saveDisplayedValue();
    stateCustomizationArgsService.saveDisplayedValue();
    $rootScope.$broadcast('onInteractionIdChanged', stateInteractionIdService.savedMemento);
    _updateStatesDict();
    graphDataService.recompute();
    _updateInteractionPreviewAndAnswerChoices();
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
