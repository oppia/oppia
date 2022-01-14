// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the add and view hints section of the state
 * editor.
 */

import { DeleteHintModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-hint-modal.component';
import { DeleteLastHintModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-last-hint-modal.component';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('components/state-directives/hint-editor/hint-editor.component.ts');
require(
  'components/state-directives/response-header/response-header.component.ts');
require('domain/exploration/HintObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-hints.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-next-content-id-index.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solution.service.ts');
require('filters/format-rte-preview.filter.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/generate-content-id.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/external-save.service.ts');
require('services/ngb-modal.service.ts');

import { AddHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-hint-modal.component';

angular.module('oppia').component('stateHintsEditor', {
  bindings: {
    onSaveHints: '=',
    onSaveNextContentIdIndex: '=',
    onSaveSolution: '=',
    showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
  },
  template: require('./state-hints-editor.component.html'),
  controller: [
    '$filter', '$rootScope', '$scope', 'AlertsService',
    'EditabilityService', 'ExternalSaveService', 'NgbModal',
    'StateEditorService', 'StateHintsService',
    'StateInteractionIdService', 'StateNextContentIdIndexService',
    'StateSolutionService',
    'UrlInterpolationService', 'WindowDimensionsService',
    'INTERACTION_SPECS',
    function(
        $filter, $rootScope, $scope, AlertsService,
        EditabilityService, ExternalSaveService, NgbModal,
        StateEditorService, StateHintsService,
        StateInteractionIdService, StateNextContentIdIndexService,
        StateSolutionService,
        UrlInterpolationService, WindowDimensionsService,
        INTERACTION_SPECS) {
      var ctrl = this;
      $scope.getHintButtonText = function() {
        var hintButtonText = '+ ADD HINT';
        if ($scope.StateHintsService.displayed) {
          if ($scope.StateHintsService.displayed.length >= 5) {
            hintButtonText = 'Limit Reached';
          }
        }
        return hintButtonText;
      };

      $scope.getHintSummary = function(hint) {
        var hintAsPlainText = $filter(
          'formatRtePreview')(hint.hintContent.html);
        return hintAsPlainText;
      };

      $scope.changeActiveHintIndex = function(newIndex) {
        var currentActiveIndex = StateHintsService.getActiveHintIndex();
        if (currentActiveIndex !== null && (
          !StateHintsService.displayed[currentActiveIndex]
            .hintContent.html)) {
          if (StateSolutionService.savedMemento &&
            StateHintsService.displayed.length === 1) {
            openDeleteLastHintModal();
            return;
          } else {
            AlertsService.addInfoMessage('Deleting empty hint.');
            StateHintsService.displayed.splice(currentActiveIndex, 1);
            StateHintsService.saveDisplayedValue();
            ctrl.onSaveHints(StateHintsService.displayed);
          }
        }
        // If the current hint is being clicked on again, close it.
        if (newIndex === StateHintsService.getActiveHintIndex()) {
          StateHintsService.setActiveHintIndex(null);
        } else {
          StateHintsService.setActiveHintIndex(newIndex);
        }
      };

      // This returns false if the current interaction ID is null.
      $scope.isCurrentInteractionLinear = function() {
        var interactionId = StateInteractionIdService.savedMemento;
        return interactionId && INTERACTION_SPECS[interactionId].is_linear;
      };

      $scope.openAddHintModal = function() {
        if ($scope.StateHintsService.displayed.length >= 5) {
          return;
        }
        AlertsService.clearWarnings();
        ExternalSaveService.onExternalSave.emit();

        NgbModal.open(AddHintModalComponent, {
          backdrop: 'static',
          windowClass: 'add-hint-modal'
        }).result.then(function(result) {
          StateHintsService.displayed.push(result.hint);
          StateHintsService.saveDisplayedValue();
          ctrl.onSaveHints(StateHintsService.displayed);
          StateNextContentIdIndexService.saveDisplayedValue();
          ctrl.onSaveNextContentIdIndex(
            StateNextContentIdIndexService.displayed);
          $rootScope.$apply();
        }, function() {
          AlertsService.clearWarnings();
        });
      };

      var openDeleteLastHintModal = function() {
        AlertsService.clearWarnings();

        NgbModal.open(DeleteLastHintModalComponent, {
          backdrop: true,
        }).result.then(function() {
          StateSolutionService.displayed = null;
          StateSolutionService.saveDisplayedValue();
          ctrl.onSaveSolution(StateSolutionService.displayed);

          StateHintsService.displayed = [];
          StateHintsService.saveDisplayedValue();
          ctrl.onSaveHints(StateHintsService.displayed);
          $rootScope.$applyAsync();
        }, function() {
          AlertsService.clearWarnings();
        });
      };

      $scope.deleteHint = function(index, evt) {
        // Prevent clicking on the delete button from also toggling the
        // display state of the hint.
        evt.stopPropagation();

        AlertsService.clearWarnings();
        NgbModal.open(DeleteHintModalComponent, {
          backdrop: true,
        }).result.then(function() {
          if (StateSolutionService.savedMemento &&
            StateHintsService.savedMemento.length === 1) {
            openDeleteLastHintModal();
          } else {
            StateHintsService.displayed.splice(index, 1);
            StateHintsService.saveDisplayedValue();
            ctrl.onSaveHints(StateHintsService.displayed);
          }

          if (index === StateHintsService.getActiveHintIndex()) {
            StateHintsService.setActiveHintIndex(null);
          }
          $rootScope.$applyAsync();
        }, function() {
          AlertsService.clearWarnings();
        });
      };

      $scope.onSaveInlineHint = function() {
        StateHintsService.saveDisplayedValue();
        ctrl.onSaveHints(StateHintsService.displayed);
      };

      $scope.toggleHintCard = function() {
        $scope.hintCardIsShown = !$scope.hintCardIsShown;
      };

      ctrl.$onInit = function() {
        $scope.EditabilityService = EditabilityService;
        $scope.StateHintsService = StateHintsService;
        $scope.hintCardIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        StateHintsService.setActiveHintIndex(null);
        $scope.canEdit = EditabilityService.isEditable();
        $scope.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };
        // When the page is scrolled so that the top of the page is above
        // the browser viewport, there are some bugs in the positioning of
        // the helper. This is a bug in jQueryUI that has not been fixed
        // yet. For more details, see http://stackoverflow.com/q/5791886
        $scope.HINT_LIST_SORTABLE_OPTIONS = {
          axis: 'y',
          cursor: 'move',
          handle: '.oppia-hint-sort-handle',
          items: '.oppia-sortable-hint',
          revert: 100,
          tolerance: 'pointer',
          start: function(e, ui) {
            ExternalSaveService.onExternalSave.emit();
            StateHintsService.setActiveHintIndex(null);
            ui.placeholder.height(ui.item.height());
          },
          stop: function() {
            StateHintsService.saveDisplayedValue();
            ctrl.onSaveHints(StateHintsService.displayed);
          }
        };
        StateEditorService.updateStateHintsEditorInitialised();
      };
    }
  ]
});
