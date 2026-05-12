// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Legacy allowlist for files that still use
 * ViewEncapsulation.None.
 *
 * No new files should be added here. These legacy usages should be removed
 * over time and replaced with component-scoped styling or a documented
 * justification comment directly above the usage.
 */

'use strict';

module.exports = [
  'core/templates/base-components/footer-donate-volunteer.component.ts',
  'core/templates/components/button-directives/create-activity-button.component.ts',
  'core/templates/pages/exploration-player-page/current-lesson-player/exploration-player-page-root.component.ts',
  'core/templates/pages/exploration-player-page/new-lesson-player/lesson-player-page-root.component.ts',
  'core/templates/pages/splash-page/splash-page.component.ts',
  'core/templates/pages/story-viewer-page/story-viewer-page-root.component.ts',
  'core/templates/pages/volunteer-page/volunteer-page.component.ts',
];
