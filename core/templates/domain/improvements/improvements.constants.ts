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
 * @fileoverview Constants related to improvements tasks.
 */

export namespace ImprovementsConstants {
  export const TASK_TYPE_HIGH_BOUNCE_RATE: string = 'high_bounce_rate';
  export const TASK_ENTITY_TYPE_EXPLORATION: string = 'exploration';
  export const TASK_TARGET_TYPE_STATE: string = 'state';

  export const TASK_STATUS_TYPE_OPEN: string = 'open';
  export const TASK_STATUS_TYPE_OBSOLETE: string = 'obsolete';
  export const TASK_STATUS_TYPE_RESOLVED: string = 'resolved';

  export const HIGH_BOUNCE_RATE_THRESHOLD_HIGH: number = 0.25;
  export const HIGH_BOUNCE_RATE_THRESHOLD_LOW: number = 0.20;
  export const HIGH_BOUNCE_RATE_MIN_EXP_STARTS: number = 100;
}
