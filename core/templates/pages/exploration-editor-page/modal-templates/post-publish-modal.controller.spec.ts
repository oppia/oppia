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
 * @fileoverview Unit tests for PostPublishModalController.
 */

describe('Post Publish Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ContextService = null;

  var explorationId = 'exp1';
  var mockWindow = {
    document: {
      execCommand: (command) => {}
    },
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
    ContextService = $injector.get('ContextService');

    spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('PostPublishModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      explorationId: explorationId
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.congratsImgUrl).toBe('/assets/images/general/congrats.svg');
      expect($scope.explorationId).toBe(explorationId);
      expect($scope.explorationLinkCopied).toBe(false);
      expect($scope.explorationLink).toBe('https://www.oppia.org/explore/exp1');
    });

  it('should add range from a click event', function() {
    var removeAllRanges = jasmine.createSpy('removeAllRanges');
    var addRange = jasmine.createSpy('addRange');
    // This throws "Argument of type '{ removeAllRanges:
    // jasmine.Spy<jasmine.Func>; addRange: jasmine.Spy<jasmine.Func>; }'
    // is not assignable to parameter of type 'Selection'." This is because
    // the type of the actual 'getSelection' function doesn't match the type
    // of function we've mocked it to. We need to suppress this error because
    // we need to mock 'getSelection' function to our function for testing
    // purposes.
    // @ts-expect-error
    spyOn(window, 'getSelection').and.returnValue({
      removeAllRanges: removeAllRanges,
      addRange: addRange
    });
    spyOn(mockWindow.document, 'execCommand').and.callThrough();

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
    expect(mockWindow.document.execCommand).toHaveBeenCalledWith('copy');
    expect($scope.explorationLinkCopied).toBe(true);
  });
});
