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
 * @fileoverview Controllers and services for the exploration preview in the editor page.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('ExplorationPreview', [
    '$scope', 'learnerParamsService', 'explorationData',
    'explorationStatesService', 'explorationInitStateNameService',
    'explorationParamSpecsService', 'explorationTitleService',
    'explorationCategoryService', 'explorationParamChangesService',
    'oppiaPlayerService',
    function($scope, learnerParamsService, explorationData,
             explorationStatesService, explorationInitStateNameService,
             explorationParamSpecsService, explorationTitleService,
             explorationCategoryService, explorationParamChangesService,
             oppiaPlayerService) {
  $scope.isExplorationPopulated = false;
  explorationData.getData().then(function(data) {
    oppiaPlayerService.populateExploration({
      category: explorationCategoryService.savedMemento,
      init_state_name: explorationInitStateNameService.savedMemento,
      param_changes: explorationParamChangesService.savedMemento,
      param_specs: explorationParamSpecsService.savedMemento,
      states: explorationStatesService.getStates(),
      title: explorationTitleService.savedMemento,
      // TODO(sll): Change this to use a service once an editor for
      // gadgets/panels is implemented.
      skin_customizations: data.skin_customizations
    });
    $scope.isExplorationPopulated = true;
  });

  $scope.allParams = {};
  $scope.$on('playerStateChange', function() {
    $scope.allParams = learnerParamsService.getAllParams();
  });
}]);
