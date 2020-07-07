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
 * @fileoverview Unit tests for DeleteSkillModalController.
 */


import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TopicsAndSkillsDashboardBackendApiService } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

describe('Delete Skill Modal Controller', function() {
  var $scope = null;
  var $rootScope = null;
  var $q = null;
  var $uibModalInstance = null;
  var skillId = 'skillId1';

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

  describe('when skill has no assigned topics', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);
      var MockTopicsAndSkillsDashboardBackendApiService = {
        fetchAssignedSkillData: () => {
          var deferred = $q.defer();
          deferred.resolve({
            assigned_topics: {}
          });
          return deferred.promise;
        }
      };
      $scope = $rootScope.$new();
      $controller('DeleteSkillModalController', {
        $scope: $scope,
        TopicsAndSkillsDashboardBackendApiService: (
          MockTopicsAndSkillsDashboardBackendApiService),
        $uibModalInstance: $uibModalInstance,
        skillId: skillId
      });
    }));

    it('should initialize the correct value', function() {
      $scope.init();
      $rootScope.$apply();
      expect($scope.assignedTopics).toEqual({});
      expect($scope.assignedTopicsAreFetched).toEqual(true);
      expect($scope.showAssignedTopics()).toEqual(false);
    });
  });

  describe('when skill has assigned topics', function() {
    var topicIdDict = {topic1: {id: 'topicId1'}};
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);
      var MockTopicsAndSkillsDashboardBackendApiService = {
        fetchAssignedSkillData: () => {
          var deferred = $q.defer();
          deferred.resolve({
            assigned_topics: topicIdDict
          });
          return deferred.promise;
        }
      };
      $scope = $rootScope.$new();
      $controller('DeleteSkillModalController', {
        $scope: $scope,
        TopicsAndSkillsDashboardBackendApiService: (
          MockTopicsAndSkillsDashboardBackendApiService),
        $uibModalInstance: $uibModalInstance,
        skillId: skillId
      });
    }));

    it('should initialize the correct value', function() {
      $scope.init();
      $rootScope.$apply();
      expect($scope.assignedTopics).toEqual(topicIdDict);
      expect($scope.assignedTopicsAreFetched).toEqual(true);
      expect($scope.showAssignedTopics()).toEqual(true);
    });
  });
});
