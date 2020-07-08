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
 * @fileoverview Unit tests for playthroughImprovementTask directive.
 */

require(
  'pages/exploration-editor-page/improvements-tab/' +
  'playthrough-improvement-task/' +
  'playthrough-improvement-task.component.ts');

describe('Playthrough Improvement Task', function() {
  var $scope = null;
  var PlaythroughIssuesService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');

    $scope = $rootScope.$new();
    $componentController('playthroughImprovementTask', {
      $scope: $scope,
    });
  }));

  it('should open playthrough modal', function() {
    spyOn(PlaythroughIssuesService, 'openPlaythroughModal');
    var playthroughId = '1';
    var index = 0;
    $scope.openPlaythroughModal(playthroughId, index);

    expect(PlaythroughIssuesService.openPlaythroughModal).toHaveBeenCalledWith(
      playthroughId, index);
  });
});
