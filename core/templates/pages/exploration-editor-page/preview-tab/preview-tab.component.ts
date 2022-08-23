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
 * @fileoverview Component for the exploration preview in the
 * editor page.
 */

require('domain/exploration/editable-exploration-backend-api.service.ts');
require('domain/exploration/ParamChangeObjectFactory.ts');
require('domain/exploration/ParamChangesObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-category.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-param-changes.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-param-specs.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require('pages/exploration-editor-page/services/parameter-metadata.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/learner-params.service.ts');
require('pages/exploration-player-page/services/number-attempts.service.ts');
require(
  'pages/exploration-player-page/services/' +
  'player-correctness-feedback-enabled.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/context.service.ts');
require('services/exploration-features.service.ts');

require(
  'pages/exploration-player-page/services/exploration-player-state.service.ts');
require('services/ngb-modal.service.ts');

import { Subscription } from 'rxjs';
import { PreviewSetParametersModalComponent } from './templates/preview-set-parameters-modal.component';

angular.module('oppia').component('previewTab', {
  template: require('./preview-tab.component.html'),
  controller: [
    '$q', '$rootScope', '$timeout', 'ContextService',
    'EditableExplorationBackendApiService',
    'ExplorationDataService', 'ExplorationEngineService',
    'ExplorationFeaturesService', 'ExplorationInitStateNameService',
    'ExplorationParamChangesService', 'ExplorationPlayerStateService',
    'ExplorationStatesService', 'GraphDataService', 'LearnerParamsService',
    'NgbModal', 'NumberAttemptsService', 'ParamChangeObjectFactory',
    'ParamChangesObjectFactory', 'ParameterMetadataService',
    'PlayerCorrectnessFeedbackEnabledService', 'RouterService',
    'StateEditorService',
    function(
        $q, $rootScope, $timeout, ContextService,
        EditableExplorationBackendApiService,
        ExplorationDataService, ExplorationEngineService,
        ExplorationFeaturesService, ExplorationInitStateNameService,
        ExplorationParamChangesService, ExplorationPlayerStateService,
        ExplorationStatesService, GraphDataService, LearnerParamsService,
        NgbModal, NumberAttemptsService, ParamChangeObjectFactory,
        ParamChangesObjectFactory, ParameterMetadataService,
        PlayerCorrectnessFeedbackEnabledService, RouterService,
        StateEditorService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.getManualParamChanges = function(initStateNameForPreview) {
        var deferred = $q.defer();

        var unsetParametersInfo = ParameterMetadataService
          .getUnsetParametersInfo([initStateNameForPreview]);

        // Construct array to hold required parameter changes.
        var manualParamChanges = [];
        for (var i = 0; i < unsetParametersInfo.length; i++) {
          var newParamChange = ParamChangeObjectFactory.createEmpty(
            unsetParametersInfo[i].paramName);
          manualParamChanges.push(newParamChange);
        }

        // Use modal to populate parameter change values.
        if (manualParamChanges.length > 0) {
          ctrl.showSetParamsModal(manualParamChanges, function() {
            deferred.resolve(manualParamChanges);
          });
        } else {
          deferred.resolve([]);
        }

        return deferred.promise;
      };

      ctrl.showParameterSummary = function() {
        return (
          ExplorationFeaturesService.areParametersEnabled() &&
          !angular.equals({}, ctrl.allParams));
      };

      ctrl.showSetParamsModal = function(manualParamChanges, callback) {
        const modalRef = NgbModal.open(PreviewSetParametersModalComponent, {
          backdrop: 'static',
          windowClass: 'oppia-preview-set-params-modal',
        });
        modalRef.componentInstance.manualParamChanges = manualParamChanges;
        modalRef.result.then(function() {
          if (callback) {
            callback();
          }
        }, function() {
          RouterService.navigateToMainTab();
        });
      };

      ctrl.loadPreviewState = function(stateName, manualParamChanges) {
        ExplorationEngineService.initSettingsFromEditor(
          stateName, manualParamChanges);
        ctrl.isExplorationPopulated = true;
      };

      ctrl.resetPreview = function() {
        ctrl.previewWarning = '';
        ctrl.isExplorationPopulated = false;
        var initStateNameForPreview = (
          ExplorationInitStateNameService.savedMemento);
        $timeout(function() {
          var explorationId = ContextService.getExplorationId();
          EditableExplorationBackendApiService.fetchApplyDraftExplorationAsync(
            explorationId).then(function(returnDict) {
            ExplorationEngineService.init(
              returnDict, null, null, null, null,
              function() {
                ctrl.loadPreviewState(initStateNameForPreview, []);
              });
            PlayerCorrectnessFeedbackEnabledService.init(
              returnDict.correctness_feedback_enabled);
            NumberAttemptsService.reset();
            $rootScope.$applyAsync();
          });
        }, 200);
      };

      ctrl.$onInit = function() {
        // This allows the active state to be kept up-to-date whilst
        // navigating in preview mode, ensuring that the state does not
        // change when toggling between editor and preview.
        ctrl.directiveSubscriptions.add(
          ExplorationEngineService.onUpdateActiveStateIfInEditor.subscribe(
            (stateName) => {
              StateEditorService.setActiveStateName(stateName);
            })
        );
        ctrl.directiveSubscriptions.add(
          ExplorationPlayerStateService.onPlayerStateChange.subscribe(() => {
            ctrl.allParams = LearnerParamsService.getAllParams();
          })
        );
        ctrl.isExplorationPopulated = false;
        ExplorationDataService.getDataAsync().then(async(explorationData) => {
          // TODO(#13564): Remove this part of code and make sure that this
          // function is executed only after the Promise in initExplorationPage
          // is fully finished.
          if (!ExplorationParamChangesService.savedMemento) {
            ExplorationParamChangesService.init(
              ParamChangesObjectFactory.createFromBackendList(
                explorationData.param_changes));
            ExplorationStatesService.init(explorationData.states);
            ExplorationInitStateNameService.init(
              explorationData.init_state_name);
            GraphDataService.recompute();
            if (
              !StateEditorService.getActiveStateName() ||
              !ExplorationStatesService.getState(
                StateEditorService.getActiveStateName()
              )
            ) {
              StateEditorService.setActiveStateName(
                ExplorationInitStateNameService.displayed);
            }
          }
          var initStateNameForPreview = StateEditorService.getActiveStateName();

          // Show a warning message if preview doesn't start from the first
          // state.
          if (initStateNameForPreview !==
              ExplorationInitStateNameService.savedMemento) {
            ctrl.previewWarning =
              'Preview started from \"' + initStateNameForPreview + '\"';
          } else {
            ctrl.previewWarning = '';
          }

          // Prompt user to enter any unset parameters, then populate
          // exploration.
          ctrl.getManualParamChanges(initStateNameForPreview).then(
            function(manualParamChanges) {
              ctrl.loadPreviewState(
                initStateNameForPreview, manualParamChanges);
            });
          $rootScope.$applyAsync();
        });
        $rootScope.$applyAsync();
        ctrl.allParams = {};
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
