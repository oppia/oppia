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
 * @fileoverview Directive for visualizing issues.
 */

oppia.directive('playthroughIssuesDirective', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/statistics_tab/' +
        'playthrough_issues_directive.html'),
      controller: [
        '$scope', 'PlaythroughIssuesService',
        function($scope, PlaythroughIssuesService) {
          PlaythroughIssuesService.getIssues().then(function(issues) {
            $scope.issues = issues;
          });

          $scope.getIssueIndex = function(issue) {
            return $scope.issues.indexOf(issue);
          };

          $scope.currentIssueIndex = -1;

          $scope.isIssueOnInitDisplay = function(issue) {
            return $scope.getIssueIndex(issue) === 0;
          };

          $scope.createIssueNavId = function(issue) {
            return $scope.getIssueIndex(issue) + 1;
          };

          $scope.isIssueDisplayed = function() {
            return $scope.currentIssueIndex > -1;
          };

          $scope.makeVisible = function(nextIssueIndex) {
            if ($scope.isIssueDisplayed()) {
              document.getElementById(
                'issue' + $scope.currentIssueIndex).style.display = 'none';
              document.getElementById(
                'issueNav' + $scope.currentIssueIndex).classList.remove(
                'text-white');
              document.getElementById(
                'issueNav' + $scope.currentIssueIndex).classList.remove(
                'bg-clr');
            }
            document.getElementById('issue' + nextIssueIndex).style.display =
              'block';
            document.getElementById(
              'issueNav' + nextIssueIndex).classList.add('text-white');
            document.getElementById(
              'issueNav' + nextIssueIndex).classList.add('bg-clr');
            $scope.currentIssueIndex = nextIssueIndex;
          };
        }
      ]
    };
  }]);
