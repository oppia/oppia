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
 * @fileoverview Controller for the question difficulty selector.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('questionDifficultySelector', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getSkillIdToRubricsObject: '&skillIdToRubricsObject',
        skillWithDifficulty: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-difficulty-selector/' +
        'question-difficulty-selector.directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope', 'SKILL_DIFFICULTY_LABEL_TO_FLOAT',
        function(
            $scope, $uibModal, $rootScope, SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
          var ctrl = this;

          ctrl.$onInit = function() {
            $scope.availableDifficultyValues = [];
            for (var difficulty in SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
              $scope.availableDifficultyValues.push(
                SKILL_DIFFICULTY_LABEL_TO_FLOAT[difficulty]);
            }
          };
        }
      ]
    };
  }]);
