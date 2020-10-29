// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the skills mastery list.
 */

export const SkillMasteryListConstants = {
  MASTERY_CUTOFF: {
    GOOD_CUTOFF: 0.7,
    MEDIUM_CUTOFF: 0.4
  },

  MASTERY_COLORS: {
    // Color green.
    GOOD_MASTERY_COLOR: 'rgb(0, 150, 136)',
    // Color orange.
    MEDIUM_MASTERY_COLOR: 'rgb(217, 92, 12)',
    // Color red.
    BAD_MASTERY_COLOR: 'rgb(201, 80, 66)'
  },
} as const;
