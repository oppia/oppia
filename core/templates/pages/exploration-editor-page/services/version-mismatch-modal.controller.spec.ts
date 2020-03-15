
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
 * @fileoverview Unit tests for VersionMismatchModalController.
 */

import { WindowRef } from 'services/contextual/window-ref.service';

describe('Version Mismatch Modal Controller', function() {
  var $scope = null;
  var $log = null;
  var logSpy = null;
  var ChangesInHumanReadableFormService = null;
  var $timeout = null;
  var windowRef = new WindowRef();
  var mockExplorationData = {
    discardDraft: function(callback) {
      callback();
    }
  };
  var lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
  }];

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', mockExplorationData);
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $log = $injector.get('$log');
    $timeout = $injector.get('$timeout');
    ChangesInHumanReadableFormService = $injector.get(
      'ChangesInHumanReadableFormService');

    logSpy = spyOn($log, 'error').and.callThrough();
    // Remove spyOn when #8729 be merged, because
    // ChangesInHumanReadableFormService was refactored in this PR.
    // Ref: https://github.com/oppia/oppia/pull/8729
    spyOn(ChangesInHumanReadableFormService, 'makeHumanReadable').and
      .returnValue({
        outerHTML: 'mocking'
      });

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller(
      'VersionMismatchModalController', {
        $scope: $scope,
        lostChanges: lostChanges
      });
  }));

  it('should evaluates lostChangesHtml when controller is initialized',
    function() {
      expect($scope.hasLostChanges);

      // Remove expect when #8729 be merged.
      expect($scope.lostChangesHtml).toBe('mocking');
      // Uncomment this piece of code below when #8729 be merged.
      // expect($scope.lostChangesHtml).toBe(
      //   '<ul>' +
      //   '<li>Added state: ' + lostChanges[0].state_name + '</li>' +
      //   '</ul>');
      expect(logSpy).toHaveBeenCalledWith(
        'Lost changes: ' + JSON.stringify(lostChanges));
    });

  it('should remove exploration draft from local storage when modal is closed',
    function() {
      var reloadSpy = jasmine.createSpy('reload');
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: reloadSpy
        }
      });
      var discardDraftSpy = spyOn(mockExplorationData, 'discardDraft').and
        .callThrough();

      $scope.discardChanges();
      expect(discardDraftSpy).toHaveBeenCalled();

      $timeout.flush(20);
      expect(reloadSpy).toHaveBeenCalled();
    });
});
