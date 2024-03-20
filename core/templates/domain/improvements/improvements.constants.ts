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

import {AppConstants} from 'app.constants';

export const ImprovementsConstants = {
  TASK_TYPE_HIGH_BOUNCE_RATE: AppConstants.TASK_TYPE_HIGH_BOUNCE_RATE,
  TASK_TYPE_NEEDS_GUIDING_RESPONSES:
    AppConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
  TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP:
    AppConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
  TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS:
    AppConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,

  TASK_TYPES: [
    AppConstants.TASK_TYPE_HIGH_BOUNCE_RATE,
    AppConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
    AppConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
    AppConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
  ],

  TASK_ENTITY_TYPE_EXPLORATION: AppConstants.TASK_ENTITY_TYPE_EXPLORATION,

  TASK_TARGET_TYPE_STATE: AppConstants.TASK_TARGET_TYPE_STATE,

  TASK_STATUS_OPEN: AppConstants.TASK_STATUS_OPEN,
  TASK_STATUS_OBSOLETE: AppConstants.TASK_STATUS_OBSOLETE,
  TASK_STATUS_RESOLVED: AppConstants.TASK_STATUS_RESOLVED,

  EXPLORATION_HEALTH_TYPE_HEALTHY: 'healthy',
  EXPLORATION_HEALTH_TYPE_WARNING: 'warning',
  EXPLORATION_HEALTH_TYPE_CRITICAL: 'critical',
  EXPLORATION_HEALTH_TYPES: ['healthy', 'warning', 'critical'],

  COMPLETION_BAR_ARC_RADIUS: 58,
  COMPLETION_BAR_ARC_LENGTH: Math.PI * 58,

  EXPLORATION_IMPROVEMENTS_URL:
    `/improvements/${AppConstants.TASK_ENTITY_TYPE_EXPLORATION}/` +
    '<exploration_id>',
  EXPLORATION_IMPROVEMENTS_HISTORY_URL:
    `/improvements/history/${AppConstants.TASK_ENTITY_TYPE_EXPLORATION}/` +
    '<exploration_id>',
  EXPLORATION_IMPROVEMENTS_CONFIG_URL:
    `/improvements/config/${AppConstants.TASK_ENTITY_TYPE_EXPLORATION}/` +
    '<exploration_id>',
} as const;
