// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Primary controller for the skill editor page.
 */

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('components/ck-editor-helpers/ck-editor-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-widgets.initializer.ts');
require(
  'components/state-directives/answer-group-editor/' +
  'answer-group-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/outcome-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-destination-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-feedback-editor.directive.ts');
require('components/state-directives/rule-editor/rule-editor.directive.ts');
require(
  'components/state-directives/rule-editor/rule-type-selector.directive.ts');
require(
  'components/state-directives/solution-editor/solution-editor.directive.ts');
require(
  'components/state-directives/solution-editor/' +
  'solution-explanation-editor.directive.ts');
require('components/forms/custom-forms-directives/html-select.directive.ts');
require('filters/convert-unicode-with-params-to-html.filter.ts');
require('filters/convert-html-to-unicode.filter.ts');
require('filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
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
  'components/forms/schema-based-editors/schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-custom-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-dict-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-html-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-list-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-primitive-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-unicode-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-viewer.directive.ts');
require('directives/MathjaxBindDirective.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
// ^^^ this block of requires should be removed ^^^

require('objects/templates/BooleanEditorDirective.ts');
require('objects/templates/CodeStringEditorDirective.ts');
require('objects/templates/CoordTwoDimEditorDirective.ts');
require('objects/templates/DragAndDropHtmlStringEditorDirective.ts');
require('objects/templates/DragAndDropPositiveIntEditorDirective.ts');
require('objects/templates/FilepathEditorDirective.ts');
require('objects/templates/FractionEditorDirective.ts');
require('objects/templates/GraphEditorDirective.ts');
require('objects/templates/GraphPropertyEditorDirective.ts');
require('objects/templates/HtmlEditorDirective.ts');
require('objects/templates/ImageWithRegionsEditorDirective.ts');
require('objects/templates/IntEditorDirective.ts');
require('objects/templates/ListOfSetsOfHtmlStringsEditorDirective.ts');
require('objects/templates/ListOfTabsEditorDirective.ts');
require('objects/templates/ListOfUnicodeStringEditorDirective.ts');
require('objects/templates/LogicErrorCategoryEditorDirective.ts');
require('objects/templates/LogicQuestionEditorDirective.ts');
require('objects/templates/MathLatexStringEditorDirective.ts');
require('objects/templates/MusicPhraseEditorDirective.ts');
require('objects/templates/NonnegativeIntEditorDirective.ts');
require('objects/templates/NormalizedStringEditorDirective.ts');
require('objects/templates/NumberWithUnitsEditorDirective.ts');
require('objects/templates/ParameterNameEditorDirective.ts');
require('objects/templates/RealEditorDirective.ts');
require('objects/templates/SanitizedUrlEditorDirective.ts');
require('objects/templates/SetOfHtmlStringEditorDirective.ts');
require('objects/templates/SetOfUnicodeStringEditorDirective.ts');
require('objects/templates/UnicodeStringEditorDirective.ts');

require('pages/skill-editor-page/navbar/skill-editor-navbar.directive.ts');
require(
  'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-editor-main-tab.directive.ts');
require('pages/skill-editor-page/questions-tab/questions-tab.directive.ts');

require('domain/utilities/LanguageUtilService.ts');
require('domain/utilities/AudioLanguageObjectFactory.ts');
require('domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts');
require('domain/utilities/BrowserCheckerService.ts');

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
oppia.constant(
  'SKILL_RIGHTS_URL_TEMPLATE',
  '/skill_editor_handler/rights/<skill_id>');

oppia.constant(
  'SKILL_PUBLISH_URL_TEMPLATE',
  '/skill_editor_handler/publish_skill/<skill_id>');

oppia.controller('SkillEditor', [
  'SkillEditorStateService', 'UrlService',
  function(SkillEditorStateService, UrlService) {
    SkillEditorStateService.loadSkill(UrlService.getSkillIdFromUrl());
  }
]);
