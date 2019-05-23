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
 * @fileoverview Dependencies for the explaration player page.
 */

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require(
  'components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.directive.ts');
require(
  'components/ck-editor-helpers/ck-editor-widgets/' +
  'ck-editor-widgets.initializer.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require(
  'components/forms/forms-unicode-filters/' +
  'convert-unicode-with-params-to-html.filter.ts');
require(
  'components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts');
require(
  'components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts');
require('components/forms/forms-validators/is-at-least.filter.ts');
require('components/forms/forms-validators/is-at-most.filter.ts');
require('components/forms/forms-validators/is-float.filter.ts');
require('components/forms/forms-validators/is-integer.filter.ts');
require('components/forms/forms-validators/is-nonempty.filter.ts');
require(
  'components/forms/forms-directives/apply-validation/' +
  'apply-validation.directive.ts');
require(
  'components/forms/forms-directives/require-is-float/' +
  'require-is-float.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-bool-editor/schema-based-bool-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-choices-editor/schema-based-choices-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-custom-editor/schema-based-custom-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-dict-editor/schema-based-dict-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-expression-editor/' +
  'schema-based-expression-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-float-editor/schema-based-float-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-html-editor/schema-based-html-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-int-editor/schema-based-int-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-list-editor/schema-based-list-editor.directive.ts');
require(
  'components/forms/forms-schema-editors/schema-based-editor/' +
  'schema-based-unicode-editor/schema-based-unicode-editor.directive.ts');
require('components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedListViewerDirective.ts');
require(
  'components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedViewerDirective.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require(
  'components/common-layout-directives/attribution-guide/' +
  'attribution-guide.directive.ts');
require(
  'components/common-layout-directives/background-banner/' +
  'background-banner.directive.ts');
require('pages/exploration-player-page/ConversationSkinDirective.ts');
require('pages/exploration-player-page/ExplorationFooterDirective.ts');
require('pages/exploration-player-page/LearnerLocalNav.ts');
require('pages/exploration-player-page/LearnerViewInfo.ts');
