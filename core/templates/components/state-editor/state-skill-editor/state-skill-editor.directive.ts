// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Skill editor section in the state editor.
*/

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-next-content-id-index.service');
require('components/skill-selector/select-skill-modal.controller.ts');
require(
  'components/skill-selector/skill-selector.component.ts');
require('services/alerts.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('stateSkillEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveLinkedSkillId: '=',
        onSaveStateContent: '=',
        onSaveNextContentIdIndex: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '<'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-skill-editor/' +
        'state-skill-editor.directive.html'),
      controller: [
        '$http', '$scope', '$uibModal', 'AlertsService',
        'StateNextContentIdIndexService', 'StateSkillService',
        'WindowDimensionsService',
        function(
            $http, $scope, $uibModal, AlertsService,
            StateNextContentIdIndexService, StateSkillService,
            WindowDimensionsService) {
          var ctrl = this;
          var categorizedSkills = null;
          var untriagedSkillSummaries = null;
          var skillSummaryData = [];
          var _init = function() {
            $http.get('/topics_and_skills_dashboard/data')
              .then(function(response) {
                var temp = response.data.categorized_skills_dict;
                var final = {};
                for (var obj in temp) {
                  final[obj] = {};
                  for (var innerobj in temp[obj]) {
                    final[obj][innerobj] = [];
                    for (var i in temp[obj][innerobj]) {
                      final[obj][innerobj].push({
                        // eslint-disable-next-line quote-props
                        'description':
                        (temp[obj][innerobj][i].skill_description),
                        // eslint-disable-next-line quote-props
                        'id': temp[obj][innerobj][i].skill_id,
                        // eslint-disable-next-line quote-props
                        '$$hashKey': temp[obj][innerobj][i].$$hashKey
                      });
                    }
                  }
                }
                categorizedSkills = final;
                untriagedSkillSummaries =
                (response.data.untriaged_skill_summary_dicts);
              });
          };

          $scope.addSkillModal = async function() {
            var allowSkillsFromOtherTopics = true;
            var skillsInSameTopicCount = 0;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              resolve: {
                skillsInSameTopicCount: () => skillsInSameTopicCount,
                sortedSkillSummaries: () => skillSummaryData,
                categorizedSkills: () => categorizedSkills,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics,
                untriagedSkillSummaries: () => untriagedSkillSummaries
              },
              keyboard: true,
              backdrop: 'static',
              windowClass: 'skill-select-modal',
              controller: 'SelectSkillModalController',
              size: 'xl'
            }).result.then(function(result) {
              try {
                StateSkillService.displayed = result.id;
                StateSkillService.saveDisplayedValue();
                $scope.onSaveLinkedSkillId(result.id);
                StateNextContentIdIndexService.saveDisplayedValue();
                $scope.onSaveNextContentIdIndex(
                  StateNextContentIdIndexService.displayed);
              } catch (err) {
                AlertsService.addInfoMessage(
                  'Given skill is already a prerequisite skill', 5000);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.deleteSkill = function() {
            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-state-skill-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              StateSkillService.displayed = null;
              StateSkillService.saveDisplayedValue();
              $scope.onSaveLinkedSkillId(StateSkillService.displayed);
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          $scope.getSkillEditorUrl = function() {
            if (StateSkillService.displayed) {
              return '/skill_editor/' + StateSkillService.displayed;
            }
          };

          $scope.toggleSkillEditor = function() {
            $scope.skillCardIsShown = !$scope.skillCardIsShown;
          };

          ctrl.$onInit = function() {
            $scope.StateSkillService = StateSkillService;
            $scope.skillCardIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            $scope.skillDescription = null;
            $scope.skillId = null;
            _init();
          };
        }
      ]
    };
  }]);
