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
  '$scope', '$timeout', 'LearnerParamsService', 'explorationData',
  'explorationStatesService', 'explorationInitStateNameService',
  'explorationParamSpecsService', 'explorationTitleService',
  'explorationCategoryService', 'explorationParamChangesService',
  'explorationGadgetsService', 'oppiaPlayerService',
  function(
      $scope, $timeout, LearnerParamsService, explorationData,
      explorationStatesService, explorationInitStateNameService,
      explorationParamSpecsService, explorationTitleService,
      explorationCategoryService, explorationParamChangesService,
      explorationGadgetsService, oppiaPlayerService) {
    $scope.isExplorationPopulated = false;
    explorationData.getData().then(function() {
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
          init_state_name: explorationInitStateNameService.savedMemento,
          param_changes: explorationParamChangesService.savedMemento,
          param_specs: explorationParamSpecsService.savedMemento,
          states: explorationStatesService.getStates(),
          title: explorationTitleService.savedMemento,
          skin_customizations: {
            panels_contents: explorationGadgetsService.getPanelsContents()
          }
        }, []);
        $scope.isExplorationPopulated = true;
      }, 200);
    });

    $scope.allParams = {};
    $scope.$on('playerStateChange', function() {
      $scope.allParams = LearnerParamsService.getAllParams();
    });
  }
]);
