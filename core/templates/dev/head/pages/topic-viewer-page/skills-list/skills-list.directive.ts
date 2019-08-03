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
 * @fileoverview Directive for the skills list.
 */

require('components/concept-card/concept-card.directive.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/topic-viewer-page/topic-viewer-page.constants.ts');
require('services/UserService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('skillsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getSortedSkillIds: '&sortedSkillIds',
        getDegreesOfMastery: '&degreesOfMastery',
        getSkillDescriptions: '&skillDescriptions'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/skills-list/skills-list.directive.html'),
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
            ctrl.canCreateCollections = userInfo.canCreateCollections();
            ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          });

          ctrl.getMasteryPercentage = function(degreeOfMastery) {
            if (!degreeOfMastery) {
              return 100;
            } else {
              return Math.round(degreeOfMastery * 100);
            }
          };

          ctrl.getColorForMastery = function(degreeOfMastery) {
            if (!degreeOfMastery) {
              return MASTERY_COLORS.NO_MASTERY_COLOR;
            }
            if (degreeOfMastery >= MASTERY_CUTOFF.GOOD_CUTOFF) {
              return MASTERY_COLORS.GOOD_MASTERY_COLOR;
            } else if (degreeOfMastery >= MASTERY_CUTOFF.MEDIUM_CUTOFF) {
              return MASTERY_COLORS.MEDIUM_MASTERY_COLOR;
            } else {
              return MASTERY_COLORS.BAD_MASTERY_COLOR;
            }
          };

          ctrl.openConceptCardModal = function(skillId) {
            var skillDescription = ctrl.getSkillDescriptions()[skillId];
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-viewer-page/skills-list/' +
                'concept-card-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function(
                    $scope, $uibModalInstance) {
                  $scope.skillIds = [skillId];
                  $scope.index = 0;
                  $scope.skillDescription = skillDescription;

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
