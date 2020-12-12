// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the parameter changes editor (which is shown in
 * both the exploration settings tab and the state editor page).
 */

require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'pages/exploration-editor-page/param-changes-editor/' +
  'value-generator-editor.directive.ts');

require('domain/exploration/ParamChangeObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-param-specs.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/editability.service.ts');
require('services/external-save.service.ts');

import { Subscription } from 'rxjs';
import { Directive, ElementRef, Injector, Input } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';


angular.module('oppia').component('paramChangesEditor', {
  bindings: {
    paramChangesService: '<',
    postSaveHook: '=',
    isCurrentlyInSettingsTab: '<'
  },
  template: require('./param-changes-editor.component.html'),
  controller: [
    '$scope', 'AlertsService', 'EditabilityService',
    'ExplorationParamSpecsService', 'ExplorationStatesService',
    'ExternalSaveService', 'ParamChangeObjectFactory',
    'UrlInterpolationService', 'INVALID_PARAMETER_NAMES',
    function(
        $scope, AlertsService, EditabilityService,
        ExplorationParamSpecsService, ExplorationStatesService,
        ExternalSaveService, ParamChangeObjectFactory,
        UrlInterpolationService, INVALID_PARAMETER_NAMES) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      var generateParamNameChoices = function() {
        return ExplorationParamSpecsService.displayed.getParamNames().sort()
          .map(function(paramName) {
            return {
              id: paramName,
              text: paramName
            };
          });
      };

      $scope.addParamChange = function() {
        var newParamName = (
          $scope.paramNameChoices.length > 0 ?
            $scope.paramNameChoices[0].id : 'x');
        var newParamChange = ParamChangeObjectFactory.createDefault(
          newParamName);
        // Add the new param name to $scope.paramNameChoices, if necessary,
        // so that it shows up in the dropdown.
        if (ExplorationParamSpecsService.displayed.addParamIfNew(
          newParamChange.name)) {
          $scope.paramNameChoices = generateParamNameChoices();
        }
        ctrl.paramChangesService.displayed.push(newParamChange);
      };

      $scope.openParamChangesEditor = function() {
        if (!EditabilityService.isEditable()) {
          return;
        }

        $scope.isParamChangesEditorOpen = true;
        $scope.paramNameChoices = generateParamNameChoices();

        if (ctrl.paramChangesService.displayed.length === 0) {
          $scope.addParamChange();
        }
      };

      $scope.onChangeGeneratorType = function(paramChange) {
        paramChange.resetCustomizationArgs();
      };

      $scope.areDisplayedParamChangesValid = function() {
        var paramChanges = ctrl.paramChangesService.displayed;

        for (var i = 0; i < paramChanges.length; i++) {
          var paramName = paramChanges[i].name;
          if (paramName === '') {
            $scope.warningText = 'Please pick a non-empty parameter name.';
            return false;
          }

          if (INVALID_PARAMETER_NAMES.indexOf(paramName) !== -1) {
            $scope.warningText = (
              'The parameter name \'' + paramName + '\' is reserved.');
            return false;
          }

          var ALPHA_CHARS_REGEX = /^[A-Za-z]+$/;
          if (!ALPHA_CHARS_REGEX.test(paramName)) {
            $scope.warningText = (
              'Parameter names should use only alphabetic characters.');
            return false;
          }

          var generatorId = paramChanges[i].generatorId;
          var customizationArgs = paramChanges[i].customizationArgs;

          if (!$scope.PREAMBLE_TEXT.hasOwnProperty(generatorId)) {
            $scope.warningText =
              'Each parameter should have a generator id.';
            return false;
          }

          if (generatorId === 'RandomSelector' &&
              customizationArgs.list_of_values.length === 0) {
            $scope.warningText = (
              'Each parameter should have at least one possible value.');
            return false;
          }
        }

        $scope.warningText = '';
        return true;
      };

      $scope.saveParamChanges = function() {
        // Validate displayed value.
        if (!$scope.areDisplayedParamChangesValid()) {
          AlertsService.addWarning('Invalid parameter changes.');
          return;
        }

        $scope.isParamChangesEditorOpen = false;

        // Update paramSpecs manually with newly-added param names.
        ExplorationParamSpecsService.restoreFromMemento();
        ctrl.paramChangesService.displayed.forEach(function(paramChange) {
          ExplorationParamSpecsService.displayed.addParamIfNew(
            paramChange.name);
        });

        ExplorationParamSpecsService.saveDisplayedValue();
        ctrl.paramChangesService.saveDisplayedValue();
        if (!ctrl.isCurrentlyInSettingsTab) {
          ExplorationStatesService.saveStateParamChanges(
            ctrl.paramChangesService.stateName,
            angular.copy(ctrl.paramChangesService.displayed));
        }
        if (ctrl.postSaveHook) {
          ctrl.postSaveHook();
        }
      };

      $scope.deleteParamChange = function(index) {
        if (index < 0 ||
            index >= ctrl.paramChangesService.displayed.length) {
          AlertsService.addWarning(
            'Cannot delete parameter change at position ' + index +
            ': index out of range');
        }

        // This ensures that any new parameter names that have been added
        // before the deletion are added to the list of possible names in
        // the select2 dropdowns. Otherwise, after the deletion, the
        // dropdowns may turn blank.
        ctrl.paramChangesService.displayed.forEach(function(paramChange) {
          ExplorationParamSpecsService.displayed.addParamIfNew(
            paramChange.name);
        });
        $scope.paramNameChoices = generateParamNameChoices();

        ctrl.paramChangesService.displayed.splice(index, 1);
      };

      $scope.cancelEdit = function() {
        ctrl.paramChangesService.restoreFromMemento();
        $scope.isParamChangesEditorOpen = false;
      };

      ctrl.$onInit = function() {
        $scope.EditabilityService = EditabilityService;
        $scope.isParamChangesEditorOpen = false;
        $scope.warningText = '';
        $scope.PREAMBLE_TEXT = {
          Copier: 'to',
          RandomSelector: 'to one of'
        };
        ctrl.directiveSubscriptions.add(
          ExternalSaveService.onExternalSave.subscribe(
            () => {
              if ($scope.isParamChangesEditorOpen) {
                $scope.saveParamChanges();
              }
            }));
        $scope.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };
        // This is a local variable that is used by the select2 dropdowns
        // for choosing parameter names. It may not accurately reflect the
        // content of ExplorationParamSpecsService, since it's possible that
        // temporary parameter names may be added and then deleted within
        // the course of a single "parameter changes" edit.
        $scope.paramNameChoices = [];
        $scope.HUMAN_READABLE_ARGS_RENDERERS = {
          Copier: function(customizationArgs) {
            return 'to ' + customizationArgs.value;
          },
          RandomSelector: function(customizationArgs) {
            var result = 'to one of [';
            for (
              var i = 0; i < customizationArgs.list_of_values.length; i++) {
              if (i !== 0) {
                result += ', ';
              }
              result += String(customizationArgs.list_of_values[i]);
            }
            result += '] at random';
            return result;
          }
        };
        $scope.PARAM_CHANGE_LIST_SORTABLE_OPTIONS = {
          axis: 'y',
          containment: '.oppia-param-change-draggable-area',
          cursor: 'move',
          handle: '.oppia-param-change-sort-handle',
          items: '.oppia-param-editor-row',
          tolerance: 'pointer',
          start: function(e, ui) {
            $scope.$apply();
            ui.placeholder.height(ui.item.height());
          },
          stop: function() {
            // This ensures that any new parameter names that have been
            // added before the swap are added to the list of possible names
            // in the select2 dropdowns. Otherwise, after the swap, the
            // dropdowns may turn blank.
            ctrl.paramChangesService.displayed.forEach(
              function(paramChange) {
                ExplorationParamSpecsService.displayed.addParamIfNew(
                  paramChange.name);
              }
            );
            $scope.paramNameChoices = generateParamNameChoices();
            $scope.$apply();
          }
        };
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});

@Directive({
  selector: 'param-changes-editor'
})
export class ParamChangesEditorDirective extends UpgradeComponent {
  @Input() paramChangesService: unknown;
  @Input() postSaveHook: () => void;
  @Input() currentlyInSettingsTab: boolean;
  constructor(elementRef: ElementRef, injector: Injector) {
    super('paramChangesEditor', elementRef, injector);
  }
}
