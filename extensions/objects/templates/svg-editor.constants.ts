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
 * @fileoverview Constants for svg filename editor.
 */

export const SvgEditorConstants = {
  // These max width and height paramameters were determined by manual
  // testing and reference from OUTPUT_IMAGE_MAX_WIDTH_PX in
  // filepath-editor file so that the created diagram fits the card
  // content.
  MAX_SVG_DIAGRAM_WIDTH: 450,
  MAX_SVG_DIAGRAM_HEIGHT: 450,
  MIN_SVG_DIAGRAM_WIDTH: 30,
  MIN_SVG_DIAGRAM_HEIGHT: 30
} as const;
