// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the FocusManagerService.
 */

describe('Focus Manager Service', function() {
  var FocusManagerService;
  var DeviceInfoService;
  var IdGenerationService;
  var rootScope;
  var $timeout;
  var clearLabel;
  var focusLabel = 'FocusLabel';
  var focusLabelTwo = 'FocusLabelTwo';

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    clearLabel = $injector.get('LABEL_FOR_CLEARING_FOCUS');
    FocusManagerService = $injector.get('FocusManagerService');
    DeviceInfoService = $injector.get('DeviceInfoService');
    IdGenerationService = $injector.get('IdGenerationService');
    rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    spyOn(rootScope, '$broadcast');
  }));

  it('should generate a random string for focus label', function() {
    spyOn(IdGenerationService, 'generateNewId');
    FocusManagerService.generateFocusLabel();
    expect(IdGenerationService.generateNewId).toHaveBeenCalled();
  });

  it('should set focus label and broadcast it', function() {
    FocusManagerService.setFocus(focusLabel);
    $timeout(function () {
      expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn', focusLabel);
    });
    $timeout.flush();
  });

  it('should not set focus label if _nextLabelToFocusOn is set', function() {
    FocusManagerService.setFocus(focusLabel);
    expect(FocusManagerService.setFocus(focusLabelTwo)).toEqual(undefined);
    $timeout.flush();
    $timeout.verifyNoPendingTasks();
    expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn', focusLabel);
  });

  it('should set label to clear focus and broadcast it', function() {
    FocusManagerService.clearFocus();
    $timeout(function () {
      expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn', clearLabel);
    });
    $timeout.flush();
  });

  it('should set focus label if on desktop and broadcast it', function() {
    FocusManagerService.setFocusIfOnDesktop(focusLabel);
    if (!DeviceInfoService.isMobileDevice()) {
      $timeout(function () {
        expect(rootScope.$broadcast).toHaveBeenCalledWith(
          'focusOn', focusLabel);
      });
      $timeout.flush();
    }
  });
});
