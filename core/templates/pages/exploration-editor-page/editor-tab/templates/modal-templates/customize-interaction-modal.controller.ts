// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for customize interaction modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');

angular.module('oppia').controller('CustomizeInteractionModalController', [
  '$controller', '$injector', '$scope', '$uibModalInstance',
  'EditorFirstTimeEventsService',
  'InteractionDetailsCacheService',
  'StateCustomizationArgsService', 'StateEditorService',
  'StateInteractionIdService', 'UrlInterpolationService',
  'ALLOWED_INTERACTION_CATEGORIES',
  'ALLOWED_QUESTION_INTERACTION_CATEGORIES',
  'INTERACTION_SPECS',
  function(
      $controller, $injector, $scope, $uibModalInstance,
      EditorFirstTimeEventsService,
      InteractionDetailsCacheService,
      StateCustomizationArgsService, StateEditorService,
      StateInteractionIdService, UrlInterpolationService,
      ALLOWED_INTERACTION_CATEGORIES,
      ALLOWED_QUESTION_INTERACTION_CATEGORIES,
      INTERACTION_SPECS) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    EditorFirstTimeEventsService
      .registerFirstClickAddInteractionEvent();

    // This binds the services to the HTML template, so that
    // their displayed values can be used in the HTML.
    $scope.StateInteractionIdService =
      StateInteractionIdService;
    $scope.StateCustomizationArgsService = (
      StateCustomizationArgsService);

    $scope.getInteractionThumbnailImageUrl = function(
        interactionId) {
      return (
        UrlInterpolationService.getInteractionThumbnailImageUrl(
          interactionId));
    };

    $scope.INTERACTION_SPECS = INTERACTION_SPECS;

    if (StateEditorService.isInQuestionMode()) {
      $scope.ALLOWED_INTERACTION_CATEGORIES = (
        ALLOWED_QUESTION_INTERACTION_CATEGORIES);
    } else {
      $scope.ALLOWED_INTERACTION_CATEGORIES = (
        ALLOWED_INTERACTION_CATEGORIES);
    }

    if (StateInteractionIdService.savedMemento) {
      $scope.customizationModalReopened = true;
      var interactionSpec = INTERACTION_SPECS[
        StateInteractionIdService.savedMemento];
      $scope.customizationArgSpecs = (
        interactionSpec.customization_arg_specs);

      StateInteractionIdService.displayed = angular.copy(
        StateInteractionIdService.savedMemento);
      StateCustomizationArgsService.displayed = {};
      // Ensure that StateCustomizationArgsService.displayed is
      // fully populated.
      for (
        var i = 0; i < $scope.customizationArgSpecs.length;
        i++) {
        var argName = $scope.customizationArgSpecs[i].name;
        StateCustomizationArgsService.displayed[argName] = {
          value: (
            StateCustomizationArgsService.savedMemento
              .hasOwnProperty(argName) ?
              angular.copy(
                StateCustomizationArgsService.savedMemento[
                  argName].value) :
              angular.copy(
                $scope.customizationArgSpecs[i].default_value)
          )
        };
      }

      $scope.$broadcast('schemaBasedFormsShown');
      $scope.form = {};
      $scope.hasCustomizationArgs = (Object.keys(
        StateCustomizationArgsService.displayed).length > 0);
    }

    $scope.getCustomizationArgsWarningsList = function() {
      var validationServiceName =
        INTERACTION_SPECS[
          $scope.StateInteractionIdService.displayed].id +
        'ValidationService';
      var validationService = $injector.get(
        validationServiceName);
      var warningsList =
        validationService.getCustomizationArgsWarnings(
          StateCustomizationArgsService.displayed);
      return warningsList;
    };

    $scope.getCustomizationArgsWarningMessage = function() {
      var warningsList = (
        $scope.getCustomizationArgsWarningsList());
      var warningMessage = '';
      if (warningsList.length !== 0) {
        warningMessage = warningsList[0].message;
      }
      return warningMessage;
    };

    $scope.onChangeInteractionId = function(newInteractionId) {
      EditorFirstTimeEventsService
        .registerFirstSelectInteractionTypeEvent();

      var interactionSpec = INTERACTION_SPECS[newInteractionId];
      $scope.customizationArgSpecs = (
        interactionSpec.customization_arg_specs);

      StateInteractionIdService.displayed = newInteractionId;
      StateCustomizationArgsService.displayed = {};
      if (
        InteractionDetailsCacheService.contains(
          newInteractionId)) {
        StateCustomizationArgsService.displayed = (
          InteractionDetailsCacheService.get(
            newInteractionId).customization);
      } else {
        $scope.customizationArgSpecs.forEach(function(caSpec) {
          StateCustomizationArgsService.displayed[caSpec.name] =
            {
              value: angular.copy(caSpec.default_value)
            };
        });
      }

      if (Object.keys(
        StateCustomizationArgsService.displayed).length === 0) {
        $scope.save();
        $scope.hasCustomizationArgs = false;
      } else {
        $scope.hasCustomizationArgs = true;
      }

      $scope.$broadcast('schemaBasedFormsShown');
      $scope.form = {};
    };

    $scope.returnToInteractionSelector = function() {
      InteractionDetailsCacheService.set(
        StateInteractionIdService.displayed,
        StateCustomizationArgsService.displayed);

      StateInteractionIdService.displayed = null;
      StateCustomizationArgsService.displayed = {};
    };

    $scope.isSaveInteractionButtonEnabled = function() {
      return $scope.hasCustomizationArgs &&
        $scope.StateInteractionIdService.displayed &&
        $scope.form.schemaForm.$valid &&
        $scope.getCustomizationArgsWarningsList().length === 0;
    };

    $scope.getSaveInteractionButtonTooltip = function() {
      if (!$scope.hasCustomizationArgs) {
        return 'No customization arguments';
      }
      if (!$scope.StateInteractionIdService.displayed) {
        return 'No interaction being displayed';
      }

      var warningsList =
        $scope.getCustomizationArgsWarningsList();
      var warningMessages = warningsList.map(function(warning) {
        return warning.message;
      });

      if (warningMessages.length === 0) {
        if ($scope.form.schemaForm.$invalid) {
          return 'Some of the form entries are invalid.';
        } else {
          return '';
        }
      } else {
        return warningMessages.join(' ');
      }
    };

    $scope.save = function() {
      EditorFirstTimeEventsService
        .registerFirstSaveInteractionEvent();
      $uibModalInstance.close();
    };
  }
]);
