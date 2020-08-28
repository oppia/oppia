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

import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

require('components/statistics-directives/completion-graph.component.ts');

describe('Completion graph', function() {
  let $componentController;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(_$componentController_ => {
    $componentController = _$componentController_;
  }));

  it('should derive style values from the completion rate', () => {
    const completionRate = 0.65;
    const ctrl = (
      $componentController('completionGraph', null, {completionRate}));
    ctrl.$onInit();

    expect(ctrl.completionBarStyle['stroke-dasharray']).toBeCloseTo(
      ImprovementsConstants.COMPLETION_BAR_ARC_LENGTH);
    expect(ctrl.completionBarStyle['stroke-dashoffset']).toBeCloseTo(
      ImprovementsConstants.COMPLETION_BAR_ARC_LENGTH * (1 - completionRate));
  });
});
