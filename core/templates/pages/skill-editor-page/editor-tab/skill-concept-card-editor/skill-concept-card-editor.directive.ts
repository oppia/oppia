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
 * @fileoverview Directive for the concept card editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/state-directives/answer-group-editor/' +
  'summary-list-header.directive.ts');
require(
  'components/review-material-editor/review-material-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
  'worked-example-editor.directive.ts');
require(
  'pages/skill-editor-page/modal-templates/' +
  'add-worked-example-modal.controller.ts');

require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/skill/skill-update.service.ts');
require('domain/skill/WorkedExampleObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/capitalize.filter.ts');
require('filters/format-rte-preview.filter.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/generate-content-id.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('skillConceptCardEditor', [
  'GenerateContentIdService', 'SkillEditorStateService', 'SkillUpdateService',
  'SubtitledHtmlObjectFactory', 'UrlInterpolationService',
  'WorkedExampleObjectFactory', 'COMPONENT_NAME_WORKED_EXAMPLE',
  function(
      GenerateContentIdService, SkillEditorStateService, SkillUpdateService,
      SubtitledHtmlObjectFactory, UrlInterpolationService,
      WorkedExampleObjectFactory, COMPONENT_NAME_WORKED_EXAMPLE) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
        'skill-concept-card-editor.directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal',
        function($scope, $filter, $uibModal) {
          var ctrl = this;

          $scope.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          ctrl.directiveSubscriptions = new Subscription();
          var initBindableFieldsDict = function() {
            $scope.bindableFieldsDict = {
              displayedConceptCardExplanation:
                $scope.skill.getConceptCard().getExplanation().getHtml(),
              displayedWorkedExamples:
                $scope.skill.getConceptCard().getWorkedExamples()
            };
          };

          var workedExamplesMemento = null;

          $scope.isEditable = function() {
            return true;
          };

          $scope.onSaveExplanation = function(explanationObject) {
            SkillUpdateService.setConceptCardExplanation(
              $scope.skill, explanationObject);
            initBindableFieldsDict();
          };

          $scope.changeActiveWorkedExampleIndex = function(idx) {
            if (idx === $scope.activeWorkedExampleIndex) {
              $scope.bindableFieldsDict.displayedWorkedExamples =
                $scope.skill.getConceptCard().getWorkedExamples();
              $scope.activeWorkedExampleIndex = null;
            } else {
              $scope.activeWorkedExampleIndex = idx;
            }
          };

          $scope.deleteWorkedExample = function(index, evt) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill-editor-page/modal-templates/' +
                'delete-worked-example-modal.directive.html'),
              backdrop: 'static',
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              SkillUpdateService.deleteWorkedExample($scope.skill, index);
              $scope.bindableFieldsDict.displayedWorkedExamples =
                $scope.skill.getConceptCard().getWorkedExamples();
              $scope.activeWorkedExampleIndex = null;
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.getWorkedExampleSummary = function(workedExampleQuestion) {
            return $filter('formatRtePreview')(workedExampleQuestion);
          };

          $scope.openAddWorkedExampleModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill-editor-page/modal-templates/' +
                'add-worked-example-modal.directive.html'),
              backdrop: 'static',
              controller: 'AddWorkedExampleModalController'
            }).result.then(function(result) {
              var newExample = WorkedExampleObjectFactory.create(
                SubtitledHtmlObjectFactory.createDefault(
                  result.workedExampleQuestionHtml,
                  GenerateContentIdService.getNextId(
                    $scope.skill.getConceptCard().getRecordedVoiceovers(
                    ).getAllContentId(),
                    COMPONENT_NAME_WORKED_EXAMPLE.QUESTION)),
                SubtitledHtmlObjectFactory.createDefault(
                  result.workedExampleExplanationHtml,
                  GenerateContentIdService.getNextId(
                    $scope.skill.getConceptCard().getRecordedVoiceovers(
                    ).getAllContentId(),
                    COMPONENT_NAME_WORKED_EXAMPLE.EXPLANATION))
              );
              SkillUpdateService.addWorkedExample(
                $scope.skill, newExample);
              $scope.bindableFieldsDict.displayedWorkedExamples =
                $scope.skill.getConceptCard().getWorkedExamples();
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            initBindableFieldsDict();
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.onSkillChange.subscribe(
                () => initBindableFieldsDict())
            );

            // When the page is scrolled so that the top of the page is above
            // the browser viewport, there are some bugs in the positioning of
            // the helper. This is a bug in jQueryUI that has not been fixed
            // yet. For more details, see http://stackoverflow.com/q/5791886
            $scope.WORKED_EXAMPLES_SORTABLE_OPTIONS = {
              axis: 'y',
              cursor: 'move',
              handle: '.oppia-worked-example-sort-handle',
              items: '.oppia-sortable-worked-example',
              revert: 100,
              tolerance: 'pointer',
              start: function(e, ui) {
                $scope.activeWorkedExampleIndex = null;
                ui.placeholder.height(ui.item.height());
              },
              stop: function() {
                var newWorkedExamples =
                  $scope.bindableFieldsDict.displayedWorkedExamples;
                SkillUpdateService.updateWorkedExamples(
                  $scope.skill, newWorkedExamples);
              }
            };
          };

          $scope.$on('$destroy', function() {
            ctrl.directiveSubscriptions.unsubscribe();
          });
        }
      ]
    };
  }
]);
