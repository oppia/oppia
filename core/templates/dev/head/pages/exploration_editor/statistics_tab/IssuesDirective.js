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

// Mapping from Issue type to corresponding directive.
oppia.constant('ISSUE_DIRECTIVE_MAPPING', {
<<<<<<< HEAD
  'EarlyQuit': '<early-quit-issue-directive>'
=======
  EarlyQuit: '<early-quit-issue-directive>'
>>>>>>> container_directive
});

oppia.directive('issuesDirective', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/statistics_tab/issues_directive.html'),
      controller: [
        '$scope', 'IssuesService', 'ISSUE_DIRECTIVE_MAPPING',
        function($scope, IssuesService, ISSUE_DIRECTIVE_MAPPING) {
          $scope.issues = IssuesService.getIssues();

          $scope.getIssueIndex = function(issue) {
            return $scope.issues.indexOf(issue);
          };

          $scope.currentIssueIndex = 0;
          $scope.currentIssue = $scope.issues[0];

          $scope.retrieveIssueDirective = function(issueIndex) {
            var issueType = $scope.issues[issueIndex].issueType;
            var issueDirective = ISSUE_DIRECTIVE_MAPPING[issueType];
            var tempLength = issueDirective.length;
            var issueDirectiveEnd = [
              issueDirective.slice(0, 1), '/',
              issueDirective.slice(1, tempLength - 1)].join('');
            issueDirectiveArgs =
              ' index="currentIssueIndex" issue="currentIssue"';
            var issueDirectiveComplete = [
              issueDirective.slice(0, tempLength - 1), issueDirectiveArgs,
              issueDirective.slice(tempLength - 1)].join('') +
              issueDirectiveEnd;
            return issueDirectiveComplete;
          };

          $scope.makeVisible = function(nextIssueIndex) {
            document.getElementById(
              'issue' + $scope.currentIssueIndex).style.display = 'none';
            document.getElementById('issue' + nextIssueIndex).style.display =
              'block';
            document.getElementById(
              'issueNav' + $scope.currentIssueIndex).classList.remove(
              'text-white');
            document.getElementById(
              'issueNav' + $scope.currentIssueIndex).classList.remove('bg-clr');
            document.getElementById(
              'issueNav' + nextIssueIndex).classList.add('text-white');
            document.getElementById(
              'issueNav' + nextIssueIndex).classList.add('bg-clr');
            $scope.currentIssueIndex = nextIssueIndex;
            $scope.currentIssue = $scope.issues[nextIssueIndex];
          };
        }
      ]
    };
  }]);
