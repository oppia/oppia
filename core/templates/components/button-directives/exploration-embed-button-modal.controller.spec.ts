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
 * @fileoverview Unit tests for ExplorationEmbedButtonModalController.
 */

describe('Exploration Embed Button Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var explorationId = 'exp1';
  var mockWindow = {
    location: {
      protocol: 'https:',
      host: 'www.oppia.org'
    }
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('ExplorationEmbedButtonModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      explorationId: explorationId
    });
  }));

  it('should init the variables', function() {
    expect($scope.explorationId).toBe(explorationId);
    expect($scope.serverName).toBe('https://www.oppia.org');
  });

  it('should add range from a click event', function() {
    var removeAllRanges = jasmine.createSpy('removeAllRanges');
    var addRange = jasmine.createSpy('addRange');
    // @ts-ignore window getSelection method return more properties than
    // removeAllRanges and addRange.
    spyOn(window, 'getSelection').and.returnValue({
      removeAllRanges: removeAllRanges,
      addRange: addRange
    });

    var firstChild = document.createElement('div');
    var lastChild = document.createElement('div');
    var element = document.createElement('div');
    element.appendChild(firstChild);
    element.appendChild(lastChild);

    element.onclick = function(event) {
      $scope.selectText(event);
    };

    element.click();

    expect(removeAllRanges).toHaveBeenCalled();
    expect(addRange).toHaveBeenCalledWith(document.createRange());
  });
});
