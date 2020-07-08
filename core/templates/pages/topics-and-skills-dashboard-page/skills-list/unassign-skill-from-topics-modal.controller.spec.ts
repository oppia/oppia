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
 * @fileoverview Unit tests for UnassignSkillToTopicModalController.
 */


import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TopicsAndSkillsDashboardBackendApiService } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

describe('Unassign Skill from Topics Modal', function() {
  var $scope = null;
  var $rootScope = null;
  var $q = null;
  var $uibModalInstance = null;
  var topicIdDict = {
    topic1: {topic_id: 'tasd42', subtopic_id: 1, topic_version: 1}
  };
  var assignedTopicDicts = [{
    topic_name: 'topic1',
    topic_id: 'tasd42',
    topic_version: 1,
    subtopic_id: 1}];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TopicsAndSkillsDashboardBackendApiService]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('TopicsAndSkillsDashboardBackendApiService',
      TestBed.get(TopicsAndSkillsDashboardBackendApiService));
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    var MockTopicsAndSkillsDashboardBackendApiService = {
      fetchAssignedSkillData: () => {
        var deferred = $q.defer();
        deferred.resolve({
          assigned_topic_dicts: assignedTopicDicts
        });
        return deferred.promise;
      }
    };
    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('UnassignSkillFromTopicModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      TopicsAndSkillsDashboardBackendApiService: (
        MockTopicsAndSkillsDashboardBackendApiService),
      skillId: 'asd'
    });
    $scope.init();
  }));

  it('should initialize the variables', function() {
    expect($scope.selectedTopicNames).toEqual([]);
    expect($scope.assignedTopicsAreFetched).toEqual(false);
  });

  it('should fetch the assigned topics', function() {
    $rootScope.$apply();
    expect($scope.selectedTopicNames).toEqual([]);
    expect($scope.assignedTopicsAreFetched).toEqual(true);
  });

  it('should select topic to unassign', function() {
    expect($scope.selectedTopicNames).toEqual([]);
    $scope.selectedTopicToUnassign('topicId1');
    expect($scope.selectedTopicNames).toEqual(['topicId1']);
    $scope.selectedTopicToUnassign('topicId1');
    expect($scope.selectedTopicNames).toEqual([]);
  });

  it('should populate the selected topics and close the modal', function() {
    $rootScope.$apply();
    $scope.selectedTopicToUnassign('topic1');
    $scope.close();
    var seletedTopics = [topicIdDict.topic1];
    expect($scope.selectedTopics).toEqual(seletedTopics);
    expect($uibModalInstance.close).toHaveBeenCalledWith(seletedTopics);
  });
});
