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
 * @fileoverview Controllers for the exploration issues tab in the exploration
 * editor.
 */

oppia.controller('IssuesTab', ['$scope', function($scope) {
  $scope.resolvedIssueCount = 13;
  $scope.archivedIssueCount = 30;

  var issueTypeMaterialIconMapping = {
    'Feedback': 'feedback',
    'Playthrough': 'gamepad',
    'Unresolved Answer': 'help',
  };

  $scope.issueTypeToMaterialIcon = function(issueType) {
    if (issueTypeMaterialIconMapping.hasOwnProperty(issueType)) {
      return issueTypeMaterialIconMapping[issueType];
    } else {
      return 'bug_report';
    }
  };

  $scope.openIssueData = [{
    issue_title: 'Multiple incorrect answers',
    issue_type: 'Playthrough',
    issue_description: (
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  }, {
    issue_title: 'A learner had something to say',
    issue_type: 'Feedback',
    issue_description: (
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  }, {
    issue_title: 'There is a common answer without explicit feedback',
    issue_type: 'Unresolved Answer',
    issue_description: (
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  }, {
    issue_title: 'Learner quit early',
    issue_type: 'Playthrough',
    issue_description: (
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  }];
}]);
