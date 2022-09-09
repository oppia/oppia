// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for explorationObjectiveEditor component.
 */

require(
  'pages/exploration-editor-page/exploration-title-editor/' +
  'exploration-title-editor.component.ts');
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Exploration Objective Editor directive', function() {
  var $scope = null;
  var ExplorationObjectiveService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    ExplorationObjectiveService = $injector.get('ExplorationObjectiveService');

    $scope = $rootScope.$new();
    $componentController('explorationObjectiveEditor', {
      $scope: $scope,
      ExplorationObjectiveService: ExplorationObjectiveService
    });
  }));

  it('should initialize controller properties after its initialization',
    function() {
      expect($scope.explorationObjectiveService).toEqual(
        ExplorationObjectiveService);
    });
});
