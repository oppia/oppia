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
 * @fileoverview Unit tests for CreateFeedbackThreadModalController.
 */

describe('Create Feedback Thread Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var AlertsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    AlertsService = $injector.get('AlertsService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('CreateFeedbackThreadModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.newThreadSubject).toEqual('');
      expect($scope.newThreadText).toEqual('');
    });

  it('should not close modal when new thread subject is emoty', function() {
    spyOn(AlertsService, 'addWarning').and.callThrough();
    var newThreadSubject = '';
    var newThreadText = 'text';
    $scope.create(newThreadSubject, newThreadText);
    expect(AlertsService.addWarning).toHaveBeenCalledWith(
      'Please specify a thread subject.');
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });

  it('should not close modal when new thread text is empty', function() {
    spyOn(AlertsService, 'addWarning').and.callThrough();
    var newThreadSubject = 'subject';
    var newThreadText = '';
    $scope.create(newThreadSubject, newThreadText);
    expect(AlertsService.addWarning).toHaveBeenCalledWith(
      'Please specify a message.');
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });

  it('should close modal when both new thread subject and new thread text are' +
    ' valid', function() {
    var newThreadSubject = 'subject';
    var newThreadText = 'text';
    $scope.create(newThreadSubject, newThreadText);

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      newThreadSubject: 'subject',
      newThreadText: 'text'
    });
  });
});
