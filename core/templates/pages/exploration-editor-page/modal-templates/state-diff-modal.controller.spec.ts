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
 * @fileoverview Unit tests for StateDiffModalController.
 */

describe('State Diff Modal Controller', function() {
  var $httpBackend = null;
  var $q = null;
  var $scope = null;
  var $timeout = null;
  var $uibModalInstance = null;
  var ContextService = null;
  var CsrfTokenService = null;
  var StateObjectFactory = null;

  var explorationId = 'exp1';
  var headers = null;
  var newState = null;
  var newStateName = 'New state';
  var oldState = null;
  var oldStateName = 'Old state';

  beforeEach(angular.mock.module('oppia'));

  describe('when new state and old state are truthy', function() {
    newState = null;
    oldState = null;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      ContextService = $injector.get('ContextService');
      spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);
      CsrfTokenService = $injector.get('CsrfTokenService');
      StateObjectFactory = $injector.get('StateObjectFactory');

      spyOn(CsrfTokenService, 'getTokenAsync')
        .and.returnValue($q.resolve('sample-csrf-token'));

      newState = StateObjectFactory.createDefaultState(newState);
      oldState = StateObjectFactory.createDefaultState(oldState);

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      // There are two post requests with the same endpoint.
      $httpBackend.expectPOST('/createhandler/state_yaml/exp1').respond({
        yaml: 'Yaml data'
      });
      $httpBackend.expectPOST('/createhandler/state_yaml/exp1').respond({
        yaml: 'Yaml data'
      });

      $scope = $rootScope.$new();
      $controller('StateDiffModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        headers: headers,
        newState: newState,
        newStateName: newStateName,
        oldState: oldState,
        oldStateName: oldStateName
      });
    }));

    it('should evaluate scope variables values correctly', function() {
      expect($scope.headers).toBe(headers);
      expect($scope.newStateName).toBe(newStateName);
      expect($scope.oldStateName).toBe(oldStateName);
      expect($scope.yamlStrs).toEqual({});
    });

    it('should evaluate yaml strings object', function() {
      $httpBackend.flush();
      expect($scope.yamlStrs.leftPane).toBe('Yaml data');
      expect($scope.yamlStrs.rightPane).toBe('Yaml data');
    });
  });

  describe('when new state and old state are falsy', function() {
    newState = null;
    oldState = null;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $timeout = $injector.get('$timeout');
      ContextService = $injector.get('ContextService');
      spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);
      CsrfTokenService = $injector.get('CsrfTokenService');

      spyOn(CsrfTokenService, 'getTokenAsync')
        .and.returnValue($q.resolve('sample-csrf-token'));

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller('StateDiffModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        headers: headers,
        newState: newState,
        newStateName: newStateName,
        oldState: oldState,
        oldStateName: oldStateName
      });
    }));

    it('should evaluate scope variables values correctly', function() {
      expect($scope.headers).toBe(headers);
      expect($scope.newStateName).toBe(newStateName);
      expect($scope.oldStateName).toBe(oldStateName);
      expect($scope.yamlStrs).toEqual({});
    });

    it('should evaluate yaml strings object', function() {
      // Flush 400 milliseconds $timeout in order to set right and left panes.
      $timeout.flush(400);
      expect($scope.yamlStrs.leftPane).toBe('');
      expect($scope.yamlStrs.rightPane).toBe('');
    });
  });
});
