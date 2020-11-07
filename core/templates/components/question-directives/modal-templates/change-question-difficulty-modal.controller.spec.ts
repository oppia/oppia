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
 * @fileoverview Unit tests for ChangeQuestionDifficultyModalController.
 */

// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Change Question Difficulty Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;

  const linkedSkillsWithDifficulty = {};
  const skillIdToRubricsObject = 'skill1';
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    const $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('ChangeQuestionDifficultyModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      linkedSkillsWithDifficulty: linkedSkillsWithDifficulty,
      skillIdToRubricsObject: skillIdToRubricsObject
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.linkedSkillsWithDifficulty).toBe(
        linkedSkillsWithDifficulty);
      expect($scope.skillIdToRubricsObject).toBe(skillIdToRubricsObject);
    });
});
