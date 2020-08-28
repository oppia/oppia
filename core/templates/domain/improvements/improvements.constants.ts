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

const constants = require('constants.ts');

export namespace ImprovementsConstants {
  export const TASK_TYPE_HIGH_BOUNCE_RATE:
    'high_bounce_rate' = constants.TASK_TYPE_HIGH_BOUNCE_RATE;
  export const TASK_TYPE_NEEDS_GUIDING_RESPONSES:
    'needs_guiding_responses' = constants.TASK_TYPE_NEEDS_GUIDING_RESPONSES;
  export const TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP:
    'ineffective_feedback_loop' = constants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP;
  export const TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS:
    'successive_incorrect_answers' = (
      constants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS);

  export const TASK_TYPES = [
    TASK_TYPE_HIGH_BOUNCE_RATE,
    TASK_TYPE_NEEDS_GUIDING_RESPONSES,
    TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
    TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
  ] as const;

  export const TASK_ENTITY_TYPE_EXPLORATION: string = (
    constants.TASK_ENTITY_TYPE_EXPLORATION);

  export const TASK_TARGET_TYPE_STATE: string = (
    constants.TASK_TARGET_TYPE_STATE);

  export const TASK_STATUS_OPEN: string = constants.TASK_STATUS_OPEN;
  export const TASK_STATUS_OBSOLETE: string = constants.TASK_STATUS_OBSOLETE;
  export const TASK_STATUS_RESOLVED: string = constants.TASK_STATUS_RESOLVED;

  export const EXPLORATION_HEALTH_TYPE_HEALTHY = 'healthy';
  export const EXPLORATION_HEALTH_TYPE_WARNING = 'warning';
  export const EXPLORATION_HEALTH_TYPE_CRITICAL = 'critical';
  export const EXPLORATION_HEALTH_TYPES = [
    EXPLORATION_HEALTH_TYPE_HEALTHY,
    EXPLORATION_HEALTH_TYPE_WARNING,
    EXPLORATION_HEALTH_TYPE_CRITICAL,
  ] as const;

  export const COMPLETION_BAR_ARC_RADIUS = 58;
  export const COMPLETION_BAR_ARC_LENGTH = Math.PI * COMPLETION_BAR_ARC_RADIUS;

  export const EXPLORATION_IMPROVEMENTS_URL: string = (
    `/improvements/${TASK_ENTITY_TYPE_EXPLORATION}/<exploration_id>`);
  export const EXPLORATION_IMPROVEMENTS_HISTORY_URL: string = (
    `/improvements/history/${TASK_ENTITY_TYPE_EXPLORATION}/<exploration_id>`);
  export const EXPLORATION_IMPROVEMENTS_CONFIG_URL: string = (
    `/improvements/config/${TASK_ENTITY_TYPE_EXPLORATION}/<exploration_id>`);
}
