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
 * @fileoverview Domain object for explorations' improvements configuration.
 */

export interface ExplorationImprovementsConfigBackendDict {
  exploration_id: string;
  exploration_version: number;
  is_improvements_tab_enabled: boolean;
  high_bounce_rate_task_state_bounce_rate_creation_threshold: number;
  high_bounce_rate_task_state_bounce_rate_obsoletion_threshold: number;
  high_bounce_rate_task_minimum_exploration_starts: number;
}

export class ExplorationImprovementsConfig {
  constructor(
    public readonly explorationId: string,
    public readonly explorationVersion: number,
    public readonly improvementsTabIsEnabled: boolean,
    public readonly highBounceRateTaskStateBounceRateCreationThreshold: number,
    public readonly highBounceRateTaskStateBounceRateObsoletionThreshold: number,
    public readonly highBounceRateTaskMinimumExplorationStarts: number
  ) {
    if (highBounceRateTaskMinimumExplorationStarts <= 0) {
      throw new Error(
        'highBounceRateTaskMinimumExplorationStarts must be greater than 0'
      );
    }
    if (
      highBounceRateTaskStateBounceRateCreationThreshold < 0 ||
      highBounceRateTaskStateBounceRateCreationThreshold > 1
    ) {
      throw new Error(
        'highBounceRateTaskStateBounceRateCreationThreshold must be in the ' +
          'closed range: [0, 1], but got: ' +
          highBounceRateTaskStateBounceRateCreationThreshold
      );
    }
    if (
      highBounceRateTaskStateBounceRateObsoletionThreshold < 0 ||
      highBounceRateTaskStateBounceRateObsoletionThreshold > 1
    ) {
      throw new Error(
        'highBounceRateTaskStateBounceRateObsoletionThreshold must be in the ' +
          'closed range: [0, 1], but got: ' +
          highBounceRateTaskStateBounceRateObsoletionThreshold
      );
    }
    if (
      highBounceRateTaskStateBounceRateCreationThreshold <
      highBounceRateTaskStateBounceRateObsoletionThreshold
    ) {
      throw new Error(
        'highBounceRateTaskStateBounceRateCreationThreshold must be ' +
          'greater than highBounceRateTaskStateBounceRateObsoletionThreshold, ' +
          'but got: ' +
          highBounceRateTaskStateBounceRateCreationThreshold +
          ' < ' +
          highBounceRateTaskStateBounceRateObsoletionThreshold
      );
    }
  }

  static createFromBackendDict(
    backendDict: ExplorationImprovementsConfigBackendDict
  ): ExplorationImprovementsConfig {
    return new ExplorationImprovementsConfig(
      backendDict.exploration_id,
      backendDict.exploration_version,
      backendDict.is_improvements_tab_enabled,
      backendDict.high_bounce_rate_task_state_bounce_rate_creation_threshold,
      backendDict.high_bounce_rate_task_state_bounce_rate_obsoletion_threshold,
      backendDict.high_bounce_rate_task_minimum_exploration_starts
    );
  }
}
