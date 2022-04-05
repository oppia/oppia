
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
 * @fileoverview Controller for the questions tab.
 */

require(
  'components/question-directives/questions-list/' +
  'questions-list.component.ts');

require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/questions-list.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('questionsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/questions-tab/' +
        'skill-questions-tab.directive.html'),
      controller: [
        '$scope', 'SkillEditorStateService',
        function(
            $scope, SkillEditorStateService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var _init = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.groupedSkillSummaries = (
              SkillEditorStateService.getGroupedSkillSummaries());
            $scope.skillIdToRubricsObject = {};
            $scope.skillIdToRubricsObject[$scope.skill.getId()] =
              $scope.skill.getRubrics();
          };
          ctrl.$onInit = function() {
            if (SkillEditorStateService.getSkill()) {
              _init();
            }
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.onSkillChange.subscribe(
                () => _init())
            );
          };

          $scope.$on('$destroy', function() {
            ctrl.directiveSubscriptions.unsubscribe();
          });
        }
      ]
    };
  }]);
