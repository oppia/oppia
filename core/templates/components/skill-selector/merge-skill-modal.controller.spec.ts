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
 * @fileoverview Unit tests for MergeSkillModalController.
 */

// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Merge Skill Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var categorizedSkills = [];
  var skill = {};
  var skillSummaries = {};
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('MergeSkillModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      categorizedSkills: categorizedSkills,
      skill: skill,
      untriagedSkillSummaries: [],
      skillSummaries: skillSummaries
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.skillSummaries).toBe(skillSummaries);
      expect($scope.categorizedSkills).toBe(categorizedSkills);
      expect($scope.allowSkillsFromOtherTopics).toBe(true);
      expect($scope.selectedSkillId).toBe(null);
    });

  it('should merge skill on closing modal', function() {
    $scope.save();
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      skill: skill,
      supersedingSkillId: null
    });
  });

  it('should set new selected skill', function() {
    $scope.selectedSkillId = '2';
    expect($scope.selectedSkillId).toBe('2');

    $scope.setSelectedSkillId('1');
    expect($scope.selectedSkillId).toBe('1');
  });
});
