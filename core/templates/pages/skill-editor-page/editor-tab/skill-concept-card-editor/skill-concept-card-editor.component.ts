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
  'components/review-material-editor/review-material-editor.component.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.component.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
  'worked-example-editor.component.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-preview-modal.controller.ts');

require('domain/skill/skill-update.service.ts');
require('domain/skill/WorkedExampleObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/capitalize.filter.ts');
require('filters/format-rte-preview.filter.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/generate-content-id.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { AddWorkedExampleModalComponent } from 'pages/skill-editor-page/modal-templates/add-worked-example.component';
import { DeleteWorkedExampleComponent } from 'pages/skill-editor-page/modal-templates/delete-worked-example-modal.component';
import { Subscription } from 'rxjs';

angular.module('oppia').component('skillConceptCardEditor', {
  bindings: {},
  template: require('./skill-concept-card-editor.component.html'),
  controller: [
    '$filter', '$rootScope', '$scope', '$uibModal',
    'GenerateContentIdService',
    'NgbModal', 'PageTitleService', 'SkillEditorStateService',
    'SkillUpdateService', 'UrlInterpolationService',
    'WindowDimensionsService', 'WorkedExampleObjectFactory',
    'COMPONENT_NAME_WORKED_EXAMPLE',
    function(
        $filter, $rootScope, $scope, $uibModal,
        GenerateContentIdService, NgbModal, PageTitleService,
        SkillEditorStateService,
        SkillUpdateService, UrlInterpolationService,
        WindowDimensionsService, WorkedExampleObjectFactory,
        COMPONENT_NAME_WORKED_EXAMPLE) {
      var ctrl = this;

      $scope.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };

      ctrl.directiveSubscriptions = new Subscription();
      var initBindableFieldsDict = function() {
        PageTitleService.setNavbarSubtitleForMobileView(
          SkillEditorStateService.getSkill().getDescription());
        $scope.bindableFieldsDict = {
          displayedConceptCardExplanation:
            $scope.skill.getConceptCard().getExplanation().html,
          displayedWorkedExamples:
            $scope.skill.getConceptCard().getWorkedExamples()
        };
      };

      $scope.isEditable = function() {
        return true;
      };

      $scope.onSaveExplanation = function(explanationObject) {
        SkillUpdateService.setConceptCardExplanation(
          $scope.skill, explanationObject);
        initBindableFieldsDict();
        // TODO(#8521): Remove the use of $rootScope.$apply()
        // once the controller is migrated to angular.
        $rootScope.$apply();
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
        NgbModal.open(DeleteWorkedExampleComponent, {
          backdrop: 'static'
        }).result.then(function() {
          SkillUpdateService.deleteWorkedExample($scope.skill, index);
          $scope.bindableFieldsDict.displayedWorkedExamples =
            $scope.skill.getConceptCard().getWorkedExamples();
          $scope.activeWorkedExampleIndex = null;
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
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
        NgbModal.open(AddWorkedExampleModalComponent, {
          backdrop: 'static'
        }).result.then(function(result) {
          var newExample = WorkedExampleObjectFactory.create(
            SubtitledHtml.createDefault(
              result.workedExampleQuestionHtml,
              GenerateContentIdService.getNextId(
                $scope.skill.getConceptCard().getRecordedVoiceovers(
                ).getAllContentIds(),
                COMPONENT_NAME_WORKED_EXAMPLE.QUESTION)),
            SubtitledHtml.createDefault(
              result.workedExampleExplanationHtml,
              GenerateContentIdService.getNextId(
                $scope.skill.getConceptCard().getRecordedVoiceovers(
                ).getAllContentIds(),
                COMPONENT_NAME_WORKED_EXAMPLE.EXPLANATION))
          );
          SkillUpdateService.addWorkedExample(
            $scope.skill, newExample);
          $scope.bindableFieldsDict.displayedWorkedExamples =
            $scope.skill.getConceptCard().getWorkedExamples();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.showSkillPreview = function() {
        var skillDescription = (
          SkillEditorStateService.getSkill().getDescription());
        var skillExplanation = (
          $scope.bindableFieldsDict.displayedConceptCardExplanation);
        var skillWorkedExamples = (
          $scope.bindableFieldsDict.displayedWorkedExamples);
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/skill-editor-page/editor-tab/' +
            'skill-preview-modal.template.html'),
          backdrop: true,
          resolve: {
            skillDescription: () => skillDescription,
            skillExplanation: () => skillExplanation,
            skillWorkedExamples: () => skillWorkedExamples
          },
          controller: 'SkillPreviewModalController'
        }).result.then(() => {}, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.toggleWorkedExampleList = function() {
        if (WindowDimensionsService.isWindowNarrow()) {
          $scope.workedExamplesListIsShown = (
            !$scope.workedExamplesListIsShown);
        }
      };

      $scope.toggleSkillEditorCard = function() {
        if (WindowDimensionsService.isWindowNarrow()) {
          $scope.skillEditorCardIsShown = !$scope.skillEditorCardIsShown;
        }
      };

      ctrl.$onInit = function() {
        $scope.skill = SkillEditorStateService.getSkill();
        initBindableFieldsDict();
        $scope.skillEditorCardIsShown = true;
        $scope.workedExamplesListIsShown = (
          !WindowDimensionsService.isWindowNarrow());
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
});
