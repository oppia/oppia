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
 * @fileoverview Unit tests for RefresherExplorationConfirmationModalController.
 */

describe('Refresher Exploration Confirmation Modal Controller', function() {
  var $flushPendingTasks = null;
  var $scope = null;
  var $uibModalInstance = null;
  var $verifyNoPendingTasks = null;
  var ContextService = null;
  var ExplorationEngineService = null;
  var UrlService = null;

  var explorationId = 'exp1';
  var redirectConfirmationCallback = jasmine.createSpy('callback');
  var refresherExplorationId = 'exp2';
  var mockWindow = {
    open: () => {}
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    var $rootScope = $injector.get('$rootScope');
    $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');

    ContextService = $injector.get('ContextService');
    spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);

    ExplorationEngineService = $injector.get('ExplorationEngineService');
    UrlService = $injector.get('UrlService');


    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('RefresherExplorationConfirmationModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      redirectConfirmationCallback: redirectConfirmationCallback,
      refresherExplorationId: refresherExplorationId
    });
  }));

  it('should confirm redirect', function() {
    spyOn(ExplorationEngineService, 'getExplorationId').and.returnValue(
      explorationId);
    spyOn(UrlService, 'getUrlParams').and.returnValue({
      collection_id: 'collection_1'
    });
    spyOn(UrlService, 'getQueryFieldValuesAsList').and.returnValue([
      'field_1', 'field_2']);
    spyOn(mockWindow, 'open').and.callThrough();
    $scope.confirmRedirect();

    $flushPendingTasks();
    $verifyNoPendingTasks('$timeout');

    expect(redirectConfirmationCallback).toHaveBeenCalled();
    expect(mockWindow.open).toHaveBeenCalledWith(
      '/explore/exp2?collection_id=collection_1&parent=field_1&' +
      'parent=field_2&parent=exp1', '_self');
    expect($uibModalInstance.close).toHaveBeenCalled();
  });
});
