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
 * @fileoverview Unit tests for SkillsMasteryListConceptCardModal.
 */

describe('Skills Mastery List Concept Card Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var skillDescription = 'This is a skill description';
  var skillId = '1';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('SkillsMasteryListConceptCardModal', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      skillDescription: skillDescription,
      skillId: skillId
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.skillIds).toEqual([skillId]);
      expect($scope.index).toEqual(0);
      expect($scope.modalHeader).toEqual(skillDescription);
    });
});
