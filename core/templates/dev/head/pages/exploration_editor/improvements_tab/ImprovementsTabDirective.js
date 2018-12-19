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
 * @fileoverview Controllers for the exploration improvements tab in the
 * exploration editor.
 */

oppia.directive('improvementsTabDirective', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/improvements_tab/' +
        'improvements_tab_directive.html'),
      controller: [
        '$scope', function($scope) {
          // NOTE: The constants used in this controller are intentionally
          // hard-coded to demonstrate that the Improvements Tab is configured
          // correctly. The numbers are arbitrary, and were simply copied from
          // the [design doc](https://bit.ly/2Bp7YLS).

          $scope.resolvedIssueCount = 13;
          $scope.archivedIssueCount = 30;

          var issueTypeMaterialIconMapping = {
            feedback: 'feedback',
            playthrough: 'gamepad',
            unresolved_answer: 'help',
          };

          $scope.issueTypeToMaterialIcon = function(issueType) {
            if (issueTypeMaterialIconMapping.hasOwnProperty(issueType)) {
              return issueTypeMaterialIconMapping[issueType];
            } else {
              return '';
            }
          };

          $scope.openIssueData = [{
            issue_description: ('I18N_IMPROVEMENTS_TAB_PLAYTHROUGH_ISSUES_' +
                                'MULTIPLE_INCORRECT_ANSWERS_DESCRIPTION'),
            issue_type: 'playthrough',
          }, {
            issue_description: 'I18N_IMPROVEMENTS_TAB_FEEDBACK_DESCRIPTION',
            issue_type: 'feedback',
          }];
        }
      ],
    };
  }]);
