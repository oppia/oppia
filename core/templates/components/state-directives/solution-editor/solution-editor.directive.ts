// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the solution editor.
 */

require(
  'components/state-directives/solution-editor/' +
  'solution-explanation-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-verification.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/exploration-html-formatter.service.ts');

angular.module('oppia').directive('solutionEditor', [
  'ExplorationHtmlFormatterService',
  'StateCustomizationArgsService',
  'StateInteractionIdService',
  'UrlInterpolationService',
  function(
      ExplorationHtmlFormatterService,
      StateCustomizationArgsService,
      StateInteractionIdService,
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getInteractionId: '&interactionId',
        onSaveSolution: '=',
        correctAnswerEditorHtml: '=',
        onOpenSolutionEditor: '&',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/solution-editor/' +
        'solution-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'StateSolutionService',
        function(StateSolutionService) {
          var ctrl = this;
          ctrl.getAnswerHtml = function() {
            return ExplorationHtmlFormatterService.getAnswerHtml(
              StateSolutionService.savedMemento.correctAnswer,
              StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento);
          };
          ctrl.$onInit = function() {
            ctrl.StateSolutionService = StateSolutionService;

            ctrl.EXPLANATION_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };
          };
        }
      ]
    };
  }
]);
