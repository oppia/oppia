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
 * @fileoverview Unit tests for the change subtopic assignment modal.
 */

describe('Change subtopic assignment modal', function() {
  beforeEach(angular.mock.module('oppia'));

  var $scope = null;
  var $uibModalInstance = null;
  var subtopics = [];
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    $scope = $rootScope.$new();
    $controller('ChangeSubtopicAssignmentModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      subtopics: subtopics
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.subtopics).toEqual(subtopics);
      expect($scope.selectedSubtopicId).toEqual(null);
    });

  it('should change the selected subtopic index', function() {
    $scope.changeSelectedSubtopic(10);
    expect($scope.selectedSubtopicId).toEqual(10);
    $scope.changeSelectedSubtopic(3);
    expect($scope.selectedSubtopicId).toEqual(3);
  });
});
