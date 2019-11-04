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
 * @fileoverview Directive for the skills mastery list.
 */

require('components/concept-card/concept-card.directive.ts');
require('components/skills-mastery-list/skills-mastery-list.constants.ajs.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/user.service.ts');

angular.module('oppia').directive('skillsMasteryList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getDegreesOfMastery: '&degreesOfMastery',
        getSkillDescriptions: '&skillDescriptions'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/skills-mastery-list/skills-mastery-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$uibModal', 'UserService',
        'MASTERY_CUTOFF', 'MASTERY_COLORS',
        function(
            $scope, $uibModal, UserService,
            MASTERY_CUTOFF, MASTERY_COLORS) {
          var ctrl = this;
          ctrl.userIsLoggedIn = null;
          UserService.getUserInfoAsync().then(function(userInfo) {
            ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          });
          ctrl.sortedSkillIds = [];

          var degreesOfMastery = ctrl.getDegreesOfMastery();
          ctrl.skillIdsAndMastery =
            Object.keys(degreesOfMastery).map(function(skillId) {
              return {
                skillId: skillId,
                mastery: degreesOfMastery[skillId]
              };
            });

          ctrl.getMasteryPercentage = function(degreeOfMastery) {
            return Math.round(degreeOfMastery * 100);
          };

          ctrl.getColorForMastery = function(degreeOfMastery) {
            if (degreeOfMastery >= MASTERY_CUTOFF.GOOD_CUTOFF) {
              return MASTERY_COLORS.GOOD_MASTERY_COLOR;
            } else if (degreeOfMastery >= MASTERY_CUTOFF.MEDIUM_CUTOFF) {
              return MASTERY_COLORS.MEDIUM_MASTERY_COLOR;
            } else {
              return MASTERY_COLORS.BAD_MASTERY_COLOR;
            }
          };

          ctrl.getMasteryBarStyle = function(skillId) {
            return {
              width: ctrl.getMasteryPercentage(
                ctrl.getDegreesOfMastery()[skillId]) + '%',
              background: ctrl.getColorForMastery(
                ctrl.getDegreesOfMastery()[skillId])
            };
          };

          ctrl.openConceptCardModal = function(skillId) {
            var skillDescription = ctrl.getSkillDescriptions()[skillId];
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/concept-card/concept-card-modal.template.html'
              ),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function(
                    $scope, $uibModalInstance) {
                  $scope.skillIds = [skillId];
                  $scope.index = 0;
                  $scope.currentSkill = skillDescription;

                  $scope.closeModal = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });
          };
        }
      ]
    };
  }]);
