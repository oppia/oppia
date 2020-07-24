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

import { AppConstants } from 'app.constants';
import { SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { Schema } from 'services/schema-default-value.service';
import { InteractionCustomizationArgsValue } from
  'interactions/customization-args-defs';
import { SchemaConstants } from
  'components/forms/schema-based-editors/schema-constants';

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
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-next-content-id-index.service');
require('domain/exploration/InteractionObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require(
  'domain/exploration/interaction-customization-arg-object.factory.ts');

angular.module('oppia').controller('CustomizeInteractionModalController', [
  '$controller', '$injector', '$scope', '$uibModalInstance',
  'EditorFirstTimeEventsService',
  'InteractionCustomizationArgObjectFactory',
  'InteractionDetailsCacheService',
  'StateCustomizationArgsService', 'StateEditorService',
  'StateInteractionIdService', 'StateNextContentIdIndexService',
  'UrlInterpolationService',
  'ALLOWED_INTERACTION_CATEGORIES',
  'ALLOWED_QUESTION_INTERACTION_CATEGORIES',
  'INTERACTION_SPECS',
  function(
      $controller, $injector, $scope, $uibModalInstance,
      EditorFirstTimeEventsService,
      InteractionCustomizationArgObjectFactory,
      InteractionDetailsCacheService,
      StateCustomizationArgsService, StateEditorService,
      StateInteractionIdService, StateNextContentIdIndexService,
      UrlInterpolationService,
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
      StateCustomizationArgsService.displayed = (
        StateCustomizationArgsService.savedMemento);

      // Ensure that StateCustomizationArgsService.displayed is
      // fully populated.
      for (
        var i = 0; i < $scope.customizationArgSpecs.length;
        i++) {
        var argName = $scope.customizationArgSpecs[i].name;
        if (
          !StateCustomizationArgsService.savedMemento.hasOwnProperty(argName)
        ) {
          throw new Error(
            `Interaction is missing customization argument ${argName}`);
        }
      }

      $scope.$broadcast('schemaBasedFormsShown');
      $scope.form = {};
      $scope.hasCustomizationArgs = (
        StateCustomizationArgsService.displayed &&
        Object.keys(StateCustomizationArgsService.displayed).length > 0
      );
    }

    $scope.getCustomizationArgsWarningsList = function() {
      var validationServiceName =
        INTERACTION_SPECS[
          $scope.StateInteractionIdService.displayed].id +
        'ValidationService';
      var validationService = $injector.get(validationServiceName);
      var warningsList = validationService.getCustomizationArgsWarnings(
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
        const customizationArgs = {};
        $scope.customizationArgSpecs.forEach(function(caSpec) {
          customizationArgs[caSpec.name] = (
            InteractionCustomizationArgObjectFactory.createFromBackendDict(
              {value: caSpec.default_value},
              caSpec.schema
            )
          );
        });

        StateCustomizationArgsService.displayed = customizationArgs;
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
      return !!($scope.hasCustomizationArgs &&
        $scope.StateInteractionIdService.displayed &&
        $scope.form.schemaForm.$valid &&
        ($scope.getCustomizationArgsWarningsList().length === 0));
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

    /**
     * The default values of SubtitledHtml and SubtitledUnicode objects in the
     * customization arguments have a null content_id. This function populates
     * these null content_id's with a content_id generated from traversing the
     * schema and with next content id index, ensuring a unique content_id.
     */
    $scope.populateNullContentIds = function() {
      const interactionId = $scope.StateInteractionIdService.displayed;

      let traverseSchemaAndAssignContentIds = (
          value: InteractionCustomizationArgsValue,
          schema: Schema,
          contentIdPrefix: string,
      ): void => {
        if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
          for (
            let i = 0;
            i < (<InteractionCustomizationArgsValue[]> value).length;
            i++
          ) {
            traverseSchemaAndAssignContentIds(
              value[i],
              <Schema> schema.items,
              `${contentIdPrefix}`);
          }
        } else if (schema.type === SchemaConstants.SCHEMA_TYPE_DICT) {
          schema.properties.forEach(property => {
            const name = property.name;
            traverseSchemaAndAssignContentIds(
              value[name],
              property.schema,
              `${contentIdPrefix}_${name}`);
          });
        } else if (
          schema.type === SchemaConstants.SCHEMA_TYPE_SUBTITLED_UNICODE ||
          schema.type === SchemaConstants.SCHEMA_TYPE_SUBTITLED_HTML
        ) {
          if ((<SubtitledHtml|SubtitledUnicode>value).getContentId() === null) {
            (<SubtitledHtml|SubtitledUnicode>value).setContentId(
              `${contentIdPrefix}_${StateNextContentIdIndexService.displayed}`
            );
            StateNextContentIdIndexService.displayed += 1;
          }
        }
      };

      const caSpecs = INTERACTION_SPECS[interactionId].customization_arg_specs;
      const caValues = StateCustomizationArgsService.displayed;
      for (const caSpec of caSpecs) {
        const name = caSpec.name;
        if (caValues.hasOwnProperty(name)) {
          traverseSchemaAndAssignContentIds(
            caValues[name].value,
            caSpec.schema,
            `${AppConstants.COMPONENT_NAME_CUSTIMOZATION_ARG}_${name}`);
        }
      }
    };

    $scope.save = function() {
      $scope.populateNullContentIds();
      EditorFirstTimeEventsService.registerFirstSaveInteractionEvent();
      $uibModalInstance.close();
    };
  }
]);
