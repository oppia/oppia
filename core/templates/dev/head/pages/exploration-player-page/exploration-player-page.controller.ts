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
  'components/ck-editor-helpers/ck-editor-rte.directive.ts');
require(
  'components/ck-editor-helpers/' +
  'ck-editor-widgets.initializer.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require(
  'filters/' +
  'convert-unicode-with-params-to-html.filter.ts');
require(
  'filters/convert-html-to-unicode.filter.ts');
require(
  'filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/' +
  'apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/' +
  'require-is-float.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-bool-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-expression-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-float-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-html-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
require('components/forms/schema-viewers/schema-based-custom-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-dict-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-html-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-list-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-primitive-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-unicode-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-viewer.directive.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'continue-button.directive.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'conversation-skin.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'exploration-footer.directive.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'learner-local-nav.controller.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'learner-view-info.controller.ts');
