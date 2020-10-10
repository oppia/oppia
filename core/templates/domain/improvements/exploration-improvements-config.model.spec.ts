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
 * @fileoverview Tests for ExplorationImprovementsConfig.
 */

import {
  ExplorationImprovementsConfig,
  ExplorationImprovementsConfigBackendDict,
} from 'domain/improvements/exploration-improvements-config.model';

describe('ExplorationImprovementsConfigModel', function() {
  it('should return an instance with specified backend values', () => {
    let backendDict: ExplorationImprovementsConfigBackendDict = {
      exploration_id: 'eid',
      exploration_version: 1,
      is_improvements_tab_enabled: true,
      high_bounce_rate_task_state_bounce_rate_creation_threshold: 0.6,
      high_bounce_rate_task_state_bounce_rate_obsoletion_threshold: 0.5,
      high_bounce_rate_task_minimum_exploration_starts: 350,
    };

    expect(
      ExplorationImprovementsConfig.createFromBackendDict(
        backendDict))
      .toEqual(
        new ExplorationImprovementsConfig('eid', 1, true, 0.6, 0.5, 350));
  });

  it('should throw an error when exp stats is zero or negative', () => {
    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, 0.6, 0.5, 0)
    ).toThrowError(
      'highBounceRateTaskMinimumExplorationStarts must be greater than 0');

    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, 0.6, 0.5, -50)
    ).toThrowError(
      'highBounceRateTaskMinimumExplorationStarts must be greater than 0');
  });

  it('should throw an error when creation threshold is not percent', () => {
    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, -0.6, 0.5, 350)
    ).toThrowError(
      'highBounceRateTaskStateBounceRateCreationThreshold must be in the ' +
      'closed range: [0, 1], but got: -0.6');

    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, 1.6, 0.5, 350)
    ).toThrowError(
      'highBounceRateTaskStateBounceRateCreationThreshold must be in the ' +
      'closed range: [0, 1], but got: 1.6');
  });

  it('should throw an error when obsoletion threshold is not percent', () => {
    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, 0.5, -0.6, 350)
    ).toThrowError(
      'highBounceRateTaskStateBounceRateObsoletionThreshold must be in the ' +
      'closed range: [0, 1], but got: -0.6');

    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, 0.5, 1.6, 350)
    ).toThrowError(
      'highBounceRateTaskStateBounceRateObsoletionThreshold must be in the ' +
      'closed range: [0, 1], but got: 1.6');
  });

  it('should throw an error when creation threshold is less than obsoletion ' +
    'threshold', () => {
    expect(
      () => new ExplorationImprovementsConfig('eid', 1, true, 0.4, 0.5, 350)
    ).toThrowError(
      'highBounceRateTaskStateBounceRateCreationThreshold must be greater ' +
      'than highBounceRateTaskStateBounceRateObsoletionThreshold, but got: ' +
      '0.4 < 0.5');
  });
});
