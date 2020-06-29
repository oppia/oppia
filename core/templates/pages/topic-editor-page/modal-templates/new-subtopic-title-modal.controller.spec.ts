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
 * @fileoverview Unit tests for NewSubtopicTitleModalController.
 */

const CONSTANTS = require('constants.ts');

describe('New Subtopic Title Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var subtopicTitles = ['Subtopic 1', 'Subtopic 2', 'Subtopic 3'];

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('NewSubtopicTitleModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      subtopicTitles: subtopicTitles
    });
  }));

  it('should check if properties was initialized correctly', function() {
    expect($scope.subtopicTitle).toBe('');
    expect($scope.subtopicTitles).toEqual(subtopicTitles);
    expect($scope.errorMsg).toBe(null);
    expect($scope.MAX_CHARS_IN_SUBTOPIC_TITLE).toBe(
      CONSTANTS.MAX_CHARS_IN_SUBTOPIC_TITLE);
  });

  it('should check if a provided subtopic title is empty', function() {
    expect($scope.isSubtopicTitleEmpty('')).toBe(true);
    expect($scope.isSubtopicTitleEmpty('Subtopic Title')).toBe(false);
    expect($scope.isSubtopicTitleEmpty()).toBe(false);
    expect($scope.isSubtopicTitleEmpty(null)).toBe(false);
  });

  it('should save a subtopic title after trying to save a subtopic title' +
    ' that was already provided', function() {
    $scope.save('Subtopic 1');
    expect($scope.errorMsg).toBe('A subtopic with this title already exists');
    expect($uibModalInstance.close).not.toHaveBeenCalled();

    $scope.resetErrorMsg();

    $scope.save('Subtopic 5');
    expect($scope.errorMsg).toBe(null);
    expect($uibModalInstance.close).toHaveBeenCalledWith('Subtopic 5');
  });
});
