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

oppia.directive('skillConceptCardEditor', [
  'UrlInterpolationService', 'SkillUpdateService', 'SkillEditorStateService',
  function(
      UrlInterpolationService, SkillUpdateService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_concept_card_editor_directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal',
        function($scope, $filter, $uibModal) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/drag_dots.png');
          $scope.HTML_SCHEMA = {
            type: 'html'
          };
          $scope.bindableFieldsDict = {
            displayedConceptCardExplanation:
              $scope.skill.getConceptCard().getExplanation(),
            displayedWorkedExamples:
              $scope.skill.getConceptCard().getWorkedExamples()
          };
          var explanationMemento = null;
          var workedExamplesMemento = null;

          $scope.isEditable = function() {
            return true;
          };

          // When the page is scrolled so that the top of the page is above the
          // browser viewport, there are some bugs in the positioning of the
          // helper. This is a bug in jQueryUI that has not been fixed yet.
          // For more details, see http://stackoverflow.com/q/5791886
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

          $scope.changeActiveWorkedExampleIndex = function(idx) {
            if (idx === $scope.activeWorkedExampleIndex) {
              $scope.activeWorkedExampleIndex = null;
            } else {
              $scope.activeWorkedExampleIndex = idx;
            }
          };

          $scope.conceptCardExplanationEditorIsShown = false;

          $scope.openConceptCardExplanationEditor = function() {
            $scope.conceptCardExplanationEditorIsShown = true;
            explanationMemento =
              $scope.bindableFieldsDict.displayedConceptCardExplanation;
          };

          $scope.closeConceptCardExplanationEditor = function() {
            $scope.conceptCardExplanationEditorIsShown = false;
            $scope.bindableFieldsDict.displayedConceptCardExplanation =
              explanationMemento;
          };

          $scope.saveConceptCardExplanation = function() {
            $scope.conceptCardExplanationEditorIsShown = false;
            SkillUpdateService.setConceptCardExplanation(
              $scope.skill,
              $scope.bindableFieldsDict.displayedConceptCardExplanation);
            explanationMemento = null;
            $scope.displayedConceptCardExplanation =
              $scope.skill.getConceptCard().getExplanation();
          };

          $scope.deleteWorkedExample = function(index, evt) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/editor_tab/' +
                'delete_worked_example_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.confirm = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }]
            }).result.then(function(result) {
              SkillUpdateService.deleteWorkedExample($scope.skill, index);
              $scope.bindableFieldsDict.displayedWorkedExamples =
                $scope.skill.getConceptCard().getWorkedExamples();
              $scope.activeWorkedExampleIndex = null;
            });
          };

          $scope.getWorkedExampleSummary = function(workedExample) {
            return $filter('formatRtePreview')(workedExample);
          };

          $scope.openAddWorkedExampleModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/editor_tab/' +
                'add_worked_example_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.WORKED_EXAMPLE_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.tmpWorkedExampleHtml = '';
                  $scope.saveWorkedExample = function() {
                    $uibModalInstance.close({
                      workedExample: $scope.tmpWorkedExampleHtml
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillUpdateService.addWorkedExample(
                $scope.skill, result.workedExample);
              $scope.bindableFieldsDict.displayedWorkedExamples =
                $scope.skill.getConceptCard().getWorkedExamples();
            });
          };

          $scope.onWorkedExampleSaved = function() {
            $scope.bindableFieldsDict.displayedWorkedExamples =
              $scope.skill.getConceptCard().getWorkedExamples();
          };
        }
      ]
    };
  }
]);
