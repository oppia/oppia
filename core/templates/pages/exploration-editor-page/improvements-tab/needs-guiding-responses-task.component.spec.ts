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

// TODO(#7222): Remove usages of UpgradedServices. Used here because too many
// indirect AngularJS dependencies are required.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

require(
  'pages/exploration-editor-page/improvements-tab/' +
  'needs-guiding-responses-task.component.ts');

describe('NeedsGuidingResponsesTask component', function() {
  let $ctrl, RouterService;

  const stateName = 'Introduction';
  const totalAnswersCount = 50;

  let task = {targetId: stateName};
  let stats = {answerStats: [], stateStats: {totalAnswersCount}};

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function(
      $componentController, _RouterService_) {
    RouterService = _RouterService_;

    $ctrl = $componentController(
      'needsGuidingResponsesTask', null, {task, stats});
    $ctrl.$onInit();
  }));

  it('should configure sorted tiles viz based on input task and stats', () => {
    expect($ctrl.sortedTilesData).toBe(stats.answerStats);
    expect($ctrl.sortedTilesOptions)
      .toEqual({header: '', use_percentages: true});
    expect($ctrl.sortedTilesTotalFrequency).toEqual(totalAnswersCount);
  });

  it('should use router service to navigate to state editor', () => {
    const navigateSpy = spyOn(RouterService, 'navigateToMainTab');

    $ctrl.navigateToStateEditor();

    expect(navigateSpy).toHaveBeenCalledWith(stateName);
  });
});
