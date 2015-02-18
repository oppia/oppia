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
    'editorContextService', 'oppiaHtmlEscaper', 'interactionRepositoryService',
    'stateInteractionIdService', 'stateCustomizationArgsService',
    'stateInteractionStickyService', 'editabilityService',
    'explorationStatesService', 'graphDataService', 'interactionDetailsCache',
    function($scope, $http, $rootScope, $modal, $filter, warningsData,
      editorContextService, oppiaHtmlEscaper, interactionRepositoryService,
      stateInteractionIdService, stateCustomizationArgsService,
      stateInteractionStickyService, editabilityService,
      explorationStatesService, graphDataService, interactionDetailsCache) {

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the
  // interaction preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.hasLoaded = false;

  var _getStateCustomizationArgsFromInteractionCustomizationArgs = function(interactionCustomizationArgs) {
    var result = {};
    for (var i = 0; i < interactionCustomizationArgs.length; i++) {
      result[interactionCustomizationArgs[i].name] = {
        value: angular.copy(interactionCustomizationArgs[i].value)
      };
    }
    return result;
  };

  var _getInteractionPreviewTag = function(interactionId, interactionCustomizationArgsList) {
    var el = $('<oppia-interactive-' + $filter('camelCaseToHyphens')(interactionId) + '/>');
    for (var i = 0; i < interactionCustomizationArgsList.length; i++) {
      el.attr(
        $filter('camelCaseToHyphens')(interactionCustomizationArgsList[i].name) + '-with-value',
        oppiaHtmlEscaper.objToEscapedJson(interactionCustomizationArgsList[i].value));
    }
    return el.get(0).outerHTML;
  };

  $scope.resetInteractionCustomizer = function() {
    $scope.interactionId = stateInteractionIdService.savedMemento;
    var stateCustomizationArgs = stateCustomizationArgsService.savedMemento;

    var interactionTemplate = angular.copy($scope.interactionRepository[$scope.interactionId]);
    for (var i = 0; i < interactionTemplate.customization_args.length; i++) {
      var caName = interactionTemplate.customization_args[i].name;
      interactionTemplate.customization_args[i].value = (
        stateCustomizationArgs.hasOwnProperty(caName) ?
        stateCustomizationArgs[caName].value :
        interactionTemplate.customization_args[i].default_value
      );
    }

    // Special cases for multiple choice input and image click input.
    if ($scope.interactionId === 'MultipleChoiceInput') {
      for (var i = 0; i < interactionTemplate.customization_args.length; i++) {
        if (interactionTemplate.customization_args[i].name == 'choices') {
          $rootScope.$broadcast(
            'updateAnswerChoices', interactionTemplate.customization_args[i].value.map(function(val, ind) {
              return {
                val: ind,
                label: val
              };
            })
          );
          break;
        }
      }
    } else if ($scope.interactionId === 'ImageClickInput') {
      for (var i = 0; i < interactionTemplate.customization_args.length; i++) {
        if (interactionTemplate.customization_args[i].name == 'imageAndRegions') {
          var _answerChoices = [];
          var imageWithRegions = interactionTemplate.customization_args[i].value;
          for (var j = 0; j < imageWithRegions.imageRegions.length; j++) {
            _answerChoices.push({
              val: imageWithRegions.imageRegions[j].label,
              label: imageWithRegions.imageRegions[j].label
            });
          }

          $rootScope.$broadcast('updateAnswerChoices', _answerChoices);
          break;
        }
      }
    } else {
      $rootScope.$broadcast('updateAnswerChoices', null);
    }

    stateInteractionStickyService.restoreFromMemento();

    $scope.interactionPreviewHtml = _getInteractionPreviewTag(
      $scope.interactionId, interactionTemplate.customization_args);
    $scope.tmpInteraction = null;
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.hasLoaded = false;

    interactionDetailsCache.reset();

    // TODO(sll): Build a file containing this data and serve it statically,
    // since it rarely changes. (But don't cache it, since it does change.)
    interactionRepositoryService.getInteractionRepository().then(function(interactionRepository) {
      $scope.stateName = editorContextService.getActiveStateName();
      $scope.interactionRepository = interactionRepository;
      $scope.interactionsByCategory = {};
      for (var interactionId in $scope.interactionRepository) {
        var interaction = $scope.interactionRepository[interactionId];
        var category = interaction.category;
        if ($scope.interactionsByCategory.hasOwnProperty(category)) {
          $scope.interactionsByCategory[category].push(interactionId);
        } else {
          $scope.interactionsByCategory[category] = [interactionId];
        }
      }

      stateInteractionIdService.init(
        $scope.stateName, stateData.interaction.id,
        stateData.interaction, 'widget_id');
      stateCustomizationArgsService.init(
        $scope.stateName, stateData.interaction.customization_args,
        stateData.interaction, 'widget_customization_args');
      stateInteractionStickyService.init(
        $scope.stateName, stateData.interaction.sticky,
        stateData.interaction, 'widget_sticky');

      $scope.stateInteractionStickyService = stateInteractionStickyService;

      $rootScope.$broadcast('initializeHandlers', {
        'interactionId': stateData.interaction.id,
        'handlers': stateData.interaction.handlers
      });

      $scope.resetInteractionCustomizer(stateData.interaction);
      $scope.hasLoaded = true;
    });
  });

  $scope.openInteractionCustomizerModal = function() {
    if (editabilityService.isEditable()) {
      warningsData.clear();

      $scope.resetInteractionCustomizer();

      $modal.open({
        templateUrl: 'modals/customizeInteraction',
        backdrop: true,
        resolve: {
          tmpInteraction: function() {
            return angular.copy(
              $scope.interactionRepository[stateInteractionIdService.savedMemento]);
          }
        },
        controller: ['$scope', '$modalInstance', 'stateCustomizationArgsService', 'tmpInteraction', function($scope, $modalInstance, stateCustomizationArgsService, tmpInteraction) {
          $scope.$broadcast('schemaBasedFormsShown');
          $scope.tmpInteraction = tmpInteraction;
          $scope.form = {};

          for (var i = 0; i < $scope.tmpInteraction.customization_args.length; i++) {
            var caName = $scope.tmpInteraction.customization_args[i].name;
            $scope.tmpInteraction.customization_args[i].value = (
              stateCustomizationArgsService.displayed.hasOwnProperty(caName) ?
              angular.copy(stateCustomizationArgsService.displayed[caName].value) :
              $scope.tmpInteraction.customization_args[i].default_value
            );
          }

          $scope.save = function() {
            $modalInstance.close({
              tmpInteraction: $scope.tmpInteraction
            });
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        }]
      }).result.then(function(result) {
        $scope.saveInteractionCustomizations(result.tmpInteraction);
      });
    }
  };

  var _updateStatesDict = function() {
    var activeStateName = editorContextService.getActiveStateName();
    var _stateDict = explorationStatesService.getState(activeStateName);
    _stateDict.interaction.id = angular.copy(
      stateInteractionIdService.savedMemento);
    _stateDict.interaction.customization_args = angular.copy(
      stateCustomizationArgsService.savedMemento);
    _stateDict.interaction.sticky = angular.copy(
      stateInteractionStickyService.savedMemento);
    explorationStatesService.setState(activeStateName, _stateDict);
  };

  $scope.saveInteractionCustomizations = function(tmpInteraction) {
    var newInteraction = angular.copy(tmpInteraction);

    stateCustomizationArgsService.displayed = _getStateCustomizationArgsFromInteractionCustomizationArgs(
      newInteraction.customization_args);
    stateCustomizationArgsService.saveDisplayedValue();
    stateInteractionStickyService.saveDisplayedValue();

    _updateStatesDict();
    graphDataService.recompute();
    $scope.resetInteractionCustomizer();
  };

  $scope.onChangeInteractionType = function(newInteractionId) {
    interactionDetailsCache.set(
      stateInteractionIdService.savedMemento,
      stateCustomizationArgsService.savedMemento);

    stateInteractionIdService.displayed = newInteractionId;
    stateInteractionIdService.saveDisplayedValue();

    if (interactionDetailsCache.contains(newInteractionId)) {
      var _cachedCustomization = interactionDetailsCache.get(newInteractionId);
      stateCustomizationArgsService.displayed = _cachedCustomization.customization;
    } else {
      var newInteraction = angular.copy($scope.interactionRepository[newInteractionId]);
      for (var i = 0; i < newInteraction.customization_args.length; i++) {
        newInteraction.customization_args[i].value = (
          newInteraction.customization_args[i].default_value);
      }
      stateCustomizationArgsService.displayed = _getStateCustomizationArgsFromInteractionCustomizationArgs(
        newInteraction.customization_args);
    }

    stateCustomizationArgsService.saveDisplayedValue();

    // This must be called here so that the rules are updated before the state
    // graph is recomputed.
    $rootScope.$broadcast('onInteractionIdChanged', newInteractionId);
    _updateStatesDict();
    graphDataService.recompute();
    $scope.resetInteractionCustomizer();
  };
}]);
