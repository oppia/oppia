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
 * @fileoverview Unit tests for AssignSkillToTopicModalController.
 */


// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Assign Skill To Topic Modal', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var topicSummaryDict = null;
  var TopicSummaryObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    TopicSummaryObjectFactory = $injector.get('TopicSummaryObjectFactory');
    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    topicSummaryDict = TopicSummaryObjectFactory.createFromBackendDict({
      id: '1',
      name: 'topic1',
      canonical_story_count: 2,
      subtopic_count: 2,
      total_skill_count: 10,
      uncategorized_skill_count: 2
    });
    $scope = $rootScope.$new();
    $controller('AssignSkillToTopicModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      topicSummaries: [topicSummaryDict]
    });
  }));

  it('should initialize correctly $scope properties after controller' +
    ' initialization', function() {
    expect($scope.topicSummaries).toEqual([topicSummaryDict]);
    expect($scope.selectedTopicIds).toEqual([]);
  });
});
