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
 * @fileoverview Controller for the select skill viewer.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('selectSkill', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        // If countOfSkillsToPrioritize > 0, then sortedSkillSummaries should
        // have the initial 'countOfSkillsToPrioritize' entries of skills with
        // the same priority.
        getSortedSkillSummaries: '&sortedSkillSummaries',
        selectedSkillId: '=',
        getCountOfSkillsToPrioritize: '&countOfSkillsToPrioritize',
        getCategorizedSkills: '&categorizedSkills',
        canAllowSkillsFromOtherTopics: '&allowSkillsFromOtherTopics',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/skill-selector/skill-selector.directive.html'),
      controller: [
        '$scope', '$uibModal', '$rootScope',
        function(
            $scope, $uibModal, $rootScope) {
          var ctrl = this;
          ctrl.$onInit = function() {
            $scope.selectedSkill = null;
            $scope.categorizedSkills = $scope.getCategorizedSkills();
            $scope.checkIfEmpty = function(skills) {
              return (skills.length === 0);
            };
            $scope.setSelectedSkillId = function() {
              $scope.selectedSkillId = $scope.selectedSkill;
            };
            $scope.hasUntriagedSkills = function(topicName) {
              return (topicName === 'untriaged_skills');
            };
            $scope.topicFilterList = [];
            $scope.subTopicFilterDict = {};
            for (var topicName in $scope.categorizedSkills) {
              if (topicName === 'untriaged_skills') {
                continue;
              }
              var topicNameDict = {
                topicName: topicName,
                checked: false
              };
              $scope.topicFilterList.push(topicNameDict);
              var subTopics = $scope.categorizedSkills[topicName];
              $scope.subTopicFilterDict[topicName] = [];
              for (var subTopic in subTopics) {
                var subTopicNameDict = {
                  subTopicName: subTopic,
                  checked: false
                };
                $scope.subTopicFilterDict[topicName].push(subTopicNameDict);
              }
            }
            var intialSubTopicFilterDict = angular.copy(
              $scope.subTopicFilterDict);

            // The folowing function is called when the subtopic filter changes.
            // This updates the list of Skills displayed in the selector.
            $scope.updateSkillsListOnSubtopicFilterChange = function() {
              var skills = $scope.getSortedSkillSummaries();
              var updatedSkillsDict = {};
              var isAnySubTopicChecked = false;
              for (var topicName in $scope.subTopicFilterDict) {
                var subTopics = $scope.subTopicFilterDict[topicName];
                for (var i = 0; i < subTopics.length; i++) {
                  if (subTopics[i].checked) {
                    if (!updatedSkillsDict.hasOwnProperty(topicName)) {
                      updatedSkillsDict[topicName] = {};
                    }
                    var categorizedSkills = $scope.getCategorizedSkills();
                    var subTopicName = subTopics[i].subTopicName;
                    updatedSkillsDict[topicName][subTopicName] = (
                      categorizedSkills[topicName][subTopicName]);
                    isAnySubTopicChecked = true;
                  }
                }
              }
              if (!isAnySubTopicChecked) {
                // If no subtopics are checked in the subtop filter, we have
                // to display all the skills from checked topics.
                var isAnyTopicChecked = false;
                for (var i = 0; i < $scope.topicFilterList.length; i++) {
                  if ($scope.topicFilterList[i].checked) {
                    var categorizedSkills = $scope.getCategorizedSkills();
                    var topicName:string = $scope.topicFilterList[i].topicName;
                    updatedSkillsDict[topicName] = (
                      categorizedSkills[topicName]);
                    isAnyTopicChecked = true;
                  }
                }
                if (isAnyTopicChecked) {
                  $scope.categorizedSkills = angular.copy(updatedSkillsDict);
                } else {
                  // If no filter is applied on both subtopics and topics, we
                  // need to display all the skills (the original list).
                  $scope.categorizedSkills = $scope.getCategorizedSkills();
                }
              } else {
                $scope.categorizedSkills = angular.copy(updatedSkillsDict);
              }
            };

            // The folowing function is called when the topic filter changes.
            // First, the subtopic filter is updated according to the changed
            // topic filter list. Then the main Skills list is updated.
            $scope.updateSkillsListOnTopicFilterChange = function() {
              var updatedSubTopicFilterList = {};
              var isAnyTopicChecked = false;
              for (var i = 0; i < $scope.topicFilterList.length; i++) {
                if ($scope.topicFilterList[i].checked) {
                  var topicName = $scope.topicFilterList[i].topicName;
                  updatedSubTopicFilterList[topicName] = (
                    angular.copy(intialSubTopicFilterDict[topicName]));
                  isAnyTopicChecked = true;
                }
              }
              if (!isAnyTopicChecked) {
                // If there are no topics checked on topic filter, we have to
                // display subtopics from all the topics in the subtopic filter.
                for (var topic in intialSubTopicFilterDict) {
                  if (!$scope.subTopicFilterDict.hasOwnProperty(topic)) {
                    $scope.subTopicFilterDict[topic] = (
                      angular.copy(intialSubTopicFilterDict[topic]));
                  }
                }
              } else {
                $scope.subTopicFilterDict =
                   angular.copy(updatedSubTopicFilterList);
              }
              // After we update the subtopic filter list, we need to update
              // the main skills list.
              $scope.updateSkillsListOnSubtopicFilterChange();
            };
            $scope.clearAllFilters = function() {
              for (var i = 0; i < $scope.topicFilterList.length; i++) {
                $scope.topicFilterList[i].checked = false;
              }
              for (var topicName in $scope.subTopicFilterDict) {
                var length = $scope.subTopicFilterDict[topicName].length;
                for (var j = 0; j < length; j++) {
                  $scope.subTopicFilterDict[topicName][j].checked = false;
                }
              }
              $scope.updateSkillsListOnTopicFilterChange();
            };
          };
        }
      ]
    };
  }]);
