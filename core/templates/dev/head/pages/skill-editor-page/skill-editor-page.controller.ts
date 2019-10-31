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

require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('base-components/base-content.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-editor-main-tab.directive.ts');
require('pages/skill-editor-page/navbar/skill-editor-navbar.directive.ts');
require(
  'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.directive.ts');
require(
  'pages/skill-editor-page/questions-tab/skill-questions-tab.directive.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').directive('skillEditorPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/skill-editor-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'SkillEditorRoutingService', 'SkillEditorStateService', 'UrlService',
        function(
            SkillEditorRoutingService, SkillEditorStateService, UrlService) {
          var ctrl = this;
          ctrl.getActiveTabName = SkillEditorRoutingService.getActiveTabName;
          SkillEditorStateService.loadSkill(UrlService.getSkillIdFromUrl());
        }
      ]
    };
  }]);
