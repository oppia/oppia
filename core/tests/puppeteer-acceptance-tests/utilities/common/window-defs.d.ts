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
 * @fileoverview Type definitions for properties attached to the window
 * object within core/tests, which is excluded from the main tsconfig
 * and therefore cannot see typings/custom-window-defs.d.ts.
 */

interface Window {
  logClick: (clickDetails: {
    position: {x: number; y: number};
    timeInMilliseconds: number;
  }) => void;
}
