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
 * @fileoverview Unit tests for the controller of the 'Completion Graph' used by
 * the improvements tab.
 */

import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';

// TODO(#7222): Remove usages of UpgradedServices. Used here because too many
// indirect AngularJS dependencies are required for the improvements tab.
import { UpgradedServices } from 'services/UpgradedServices';

require(
  'pages/exploration-editor-page/improvements-tab/' +
  'improvements-tab.component.ts');

describe('Improvements tab', function() {
  let $ctrl, $scope, explorationImprovementsService;

  let explorationImprovementsTaskRegistryService:
    ExplorationImprovementsTaskRegistryService;

  beforeEach(angular.mock.module('oppia', $provide => {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      $componentController, $rootScope, _ExplorationImprovementsService_,
      _ExplorationImprovementsTaskRegistryService_) {
    explorationImprovementsService = _ExplorationImprovementsService_;
    explorationImprovementsTaskRegistryService = (
      _ExplorationImprovementsTaskRegistryService_);

    $scope = $rootScope.$new();
    $ctrl = $componentController('improvementsTab');
  }));

  fit('should provide the time machine image url', () => {
    $ctrl.$onInit();

    expect($ctrl.timeMachineImageUrl).toMatch('/icons/time_machine.svg');
  });
});
