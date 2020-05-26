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
 * @fileoverview Directive for the answer group editor.
 */

require('directives/angular-html-bind.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

angular.module('oppia').directive('questionMisconceptionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getTaggedSkillMisconceptionId: '&taggedSkillMisconceptionId',
        isEditable: '=',
        getOnSaveTaggedMisconception: '&onSaveTaggedMisconception',
        getOnSaveAnswerGroupFeedbackFn: '&onSaveAnswerGroupFeedback',
        outcome: '=',
        rules: '=',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-directives/question-misconception-editor/' +
        'question-misconception-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$uibModal', 'StateEditorService',
        function(
            $rootScope, $uibModal, StateEditorService) {
          var ctrl = this;
          var _getTaggedMisconceptionName = function(skillMisconceptionId) {
            if (skillMisconceptionId) {
              if (typeof skillMisconceptionId === 'string' &&
                  skillMisconceptionId.split('-').length === 2) {
                var skillId = skillMisconceptionId.split('-')[0];
                var misconceptionId = skillMisconceptionId.split('-')[1];
                var misconceptions = ctrl.misconceptionsBySkill[skillId];

                for (var i = 0; i < misconceptions.length; i++) {
                  if (misconceptions[i].getId().toString() ===
                    misconceptionId) {
                    ctrl.misconceptionName = misconceptions[i].getName();
                  }
                }
              } else {
                throw new Error(
                  'Expected skillMisconceptionId to be ' +
                  '<skillId>-<misconceptionId>.');
              }
            }
          };

          ctrl.containsMisconceptions = function() {
            var containsMisconceptions = false;
            Object.keys(ctrl.misconceptionsBySkill).forEach(function(skillId) {
              if (ctrl.misconceptionsBySkill[skillId].length > 0) {
                containsMisconceptions = true;
              }
            });
            return containsMisconceptions;
          };

          ctrl.tagAnswerGroupWithMisconception = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'tag-misconception-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', 'StateEditorService',
                function($scope, $uibModalInstance, StateEditorService) {
                  $scope.misconceptionsBySkill = (
                    StateEditorService.getMisconceptionsBySkill());
                  $scope.selectedMisconception = null;
                  $scope.selectedMisconceptionSkillId = null;
                  $scope.misconceptionFeedbackIsUsed = true;

                  $scope.selectMisconception = function(
                      misconception, skillId) {
                    $scope.selectedMisconception = angular.copy(misconception);
                    $scope.selectedMisconceptionSkillId = skillId;
                  };

                  $scope.toggleMisconceptionFeedbackUsage = function() {
                    $scope.misconceptionFeedbackIsUsed =
                      !$scope.misconceptionFeedbackIsUsed;
                  };

                  $scope.done = function() {
                    $uibModalInstance.close({
                      misconception: $scope.selectedMisconception,
                      misconceptionSkillId: $scope.selectedMisconceptionSkillId,
                      feedbackIsUsed: $scope.misconceptionFeedbackIsUsed
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(returnObject) {
              var misconception = returnObject.misconception;
              var misconceptionSkillId = returnObject.misconceptionSkillId;
              var feedbackIsUsed = returnObject.feedbackIsUsed;
              var outcome = angular.copy(ctrl.outcome);
              if (feedbackIsUsed) {
                outcome.feedback.setHtml(misconception.getFeedback());
                ctrl.getOnSaveAnswerGroupFeedbackFn()(outcome);
                $rootScope.$broadcast('externalSave');
              }
              ctrl.getOnSaveTaggedMisconception()(
                misconception.getId(), misconceptionSkillId);
              _getTaggedMisconceptionName(
                misconceptionSkillId + '-' + misconception.getId());
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            ctrl.misconceptionName = null;
            ctrl.misconceptionsBySkill =
              StateEditorService.getMisconceptionsBySkill();

            _getTaggedMisconceptionName(ctrl.getTaggedSkillMisconceptionId());
          };
        }
      ]
    };
  }]);
