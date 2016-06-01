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
 * @fileoverview Controllers and services for the exploration preview in the
 * editor page.
 */

oppia.controller('PreviewTab', [
  '$scope', '$modal', '$q', '$timeout', 'LearnerParamsService',
  'explorationData', 'editorContextService',
  'explorationStatesService', 'explorationInitStateNameService',
  'explorationParamSpecsService', 'explorationTitleService',
  'explorationCategoryService', 'explorationParamChangesService',
  'explorationGadgetsService', 'oppiaPlayerService', 'parameterMetadataService',
  function(
      $scope, $modal, $q, $timeout, LearnerParamsService,
      explorationData, editorContextService,
      explorationStatesService, explorationInitStateNameService,
      explorationParamSpecsService, explorationTitleService,
      explorationCategoryService, explorationParamChangesService,
      explorationGadgetsService, oppiaPlayerService, parameterMetadataService) {
    $scope.isExplorationPopulated = false;
    explorationData.getData().then(function() {
      var initStateNameForPreview = editorContextService.getActiveStateName();
      var manualParamChanges = [];

      // Show a warning message if preview doesn't start from the first state
      if (initStateNameForPreview !==
          explorationInitStateNameService.savedMemento) {
        $scope.previewWarning =
          'Preview started from \"' + initStateNameForPreview + '\"';
      } else {
        $scope.previewWarning = '';
      }

      // Prompt user to enter any unset parameters, then populate exploration
      manualParamChanges = $scope.getManualParamChanges(
        initStateNameForPreview).then(function(manualParamChanges) {
        $scope.loadPreviewState(initStateNameForPreview, manualParamChanges);
      });
    });

    $scope.getManualParamChanges = function(initStateNameForPreview) {
      var deferred = $q.defer();

      var unsetParametersInfo = parameterMetadataService.getUnsetParametersInfo(
        [initStateNameForPreview]);

      // Construct array to hold required parameter changes
      var getDefaultParameterChange = function(name) {
        return angular.copy({
          customization_args: {
            parse_with_jinja: true,
            value: ''
          },
          generator_id: 'Copier',
          name: name
        });
      };
      var manualParamChanges = [];
      for (var i = 0; i < unsetParametersInfo.length; i++) {
        var newParamChange =
          getDefaultParameterChange(unsetParametersInfo[i].paramName);
        manualParamChanges.push(newParamChange);
      };

      // Use modal to populate parameter change values
      if (manualParamChanges.length > 0) {
        $scope.showSetParamsModal(manualParamChanges, function() {
          deferred.resolve(manualParamChanges);
        });
      } else {
        deferred.resolve([]);
      };

      return deferred.promise;
    };

    $scope.showSetParamsModal = function(manualParamChanges, callback) {
      var modalInstance = $modal.open({
        templateUrl: 'modals/previewParams',
        backdrop: 'static',
        windowClass: 'oppia-preview-set-params-modal',
        controller: [
          '$scope', '$modalInstance', 'routerService',
          function($scope, $modalInstance, routerService) {
            $scope.manualParamChanges = manualParamChanges;
            $scope.previewParamModalOk = $modalInstance.close;
            $scope.previewParamModalCancel = function() {
              $modalInstance.dismiss('cancel');
              routerService.navigateToMainTab();
            };
          }
        ]
      }).result.then(function() {
        if (callback) {
          callback();
        }
      });
    };

    $scope.loadPreviewState = function(stateName, manualParamChanges) {
      // There is a race condition here that can sometimes occur when the editor
      // preview tab is loaded: the exploration in PlayerServices is populated,
      // but with null values for the category, init_state_name, etc. fields,
      // presumably because the various exploration property services have not
      // yet been updated. The timeout alleviates this.
      // TODO(sll): Refactor the editor frontend to create a single place for
      // obtaining the current version of the exploration, so that the use of
      // $timeout isn't necessary.
      $timeout(function() {
        oppiaPlayerService.populateExploration({
          category: explorationCategoryService.savedMemento,
          init_state_name: stateName,
          param_changes: explorationParamChangesService.savedMemento,
          param_specs: explorationParamSpecsService.savedMemento,
          states: explorationStatesService.getStates(),
          title: explorationTitleService.savedMemento,
          skin_customizations: {
            panels_contents: explorationGadgetsService.getPanelsContents()
          }
        }, manualParamChanges);
        $scope.isExplorationPopulated = true;
      }, 200);
    };

    // This allows the active state to be kept up-to-date whilst navigating in
    // preview mode, ensuring that the state does not change when toggling
    // between editor and preview.
    $scope.$on('updateActiveStateIfInEditor', function(evt, stateName) {
      editorContextService.setActiveStateName(stateName);
    });

    $scope.allParams = {};
    $scope.$on('playerStateChange', function() {
      $scope.allParams = LearnerParamsService.getAllParams();
    });
  }
]);
