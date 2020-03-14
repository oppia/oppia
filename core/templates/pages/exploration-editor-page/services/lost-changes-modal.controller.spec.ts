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
 * @fileoverview Unit tests for LostChangesModalController.
 */

describe('Lost Changes Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $log = null;
  var logSpy = null;
  var LocalStorageService = null;
  var ChangesInHumanReadableFormService = null;
  var explorationId = '0';
  var lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
  }];

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $log = $injector.get('$log');
    LocalStorageService = $injector.get('LocalStorageService');
    ChangesInHumanReadableFormService = $injector.get(
      'ChangesInHumanReadableFormService');

    logSpy = spyOn($log, 'error').and.callThrough();

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller(
      'LostChangesModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        explorationId: explorationId,
        lostChanges: lostChanges
      });
  }));

  it('should evaluates lostChangesHtml when controller is initialized',
    function() {
      expect($scope.lostChangesHtml).toBe(
        '<ul>' +
        '<li>Added state: ' + lostChanges[0].state_name + '</li>' +
        '</ul>');
      expect(logSpy).toHaveBeenCalledWith(
        'Lost changes: ' + JSON.stringify(lostChanges));
    });

  it('should remove exploration draft from local storage when modal is closed',
    function() {
      LocalStorageService.saveExplorationDraft(explorationId, [], 1);
      $scope.close();
      expect(LocalStorageService.getExplorationDraft(explorationId)).toBeNull();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
});
