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
 * @fileoverview Unit tests for for learnerPlaylistModal.
 */

describe('Learner Playlist Modal Controller', function() {
  var $scope = null;
  var $httpBackend = null;
  var CsrfService = null;
  var $uibModalInstance;
  var activityId = '0';
  var activityType = 'exploration';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller, $q) {
    var $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller(
      'LearnerPlaylistModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        activityId: '0',
        activityTitle: 'Title',
        activityType: 'exploration'
      });
  }));

  it('should remove from learn playlist when cicking on remove button',
    function() {
      $httpBackend.expect(
        'DELETE', '/learnerplaylistactivityhandler/' + activityType + '/' +
        activityId).respond(200);
      $scope.remove();
      $httpBackend.flush();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });

  it('should not remove from learn playlist when cicking on cancel button',
    function() {
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
});
