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
 * @fileoverview Unit tests for DeleteTopicModalController.
 */

describe('Delete Topic Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var skillDict = {
    id: '1',
    description: 'test description',
    misconceptions: [],
    language_code: 'en',
    version: 3,
    prerequisite_skill_ids: []
  };
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('MergeSkillModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      skillSummaries: [skillDict],
      skill: skillDict
    });
  }));

  it('should close modal with the correct value', function() {
    expect($scope.skillSummaries).toEqual([skillDict]);
    var result = {
      skill: skillDict,
      supersedingSkillId: $scope.selectedSkillId
    };
    $scope.confirm();
    expect($uibModalInstance.close).toHaveBeenCalledWith(result);
  });


  it('should dismiss modal with the correct value', function() {
    var result = {
      skill: skillDict,
      supersedingSkillId: $scope.selectedSkillId
    };
    $scope.save();
    expect($uibModalInstance.close).toHaveBeenCalledWith(result);
  });
});
