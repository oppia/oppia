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
  var clearFocusLabel;
  var rootScope;
  var $timeout;
  var focuslabel = 'FocusLabel';

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector, LABEL_FOR_CLEARING_FOCUS) {
    FocusManagerService = $injector.get('FocusManagerService');
    DeviceInfoService = $injector.get('DeviceInfoService');
    IdGenerationService = $injector.get('IdGenerationService');
    rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    clearLabel = LABEL_FOR_CLEARING_FOCUS;
    spyOn(rootScope, '$broadcast');
  }));

  it('should generate a random string for focus label', function() {
    spyOn(IdGenerationService, 'generateNewId');
    FocusManagerService.generateFocusLabel();
    expect(IdGenerationService.generateNewId).toHaveBeenCalled();
  });

  it('should set focus label and broadcast it', function() {
    FocusManagerService.setFocus(focuslabel);
    $timeout(function () {
      expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn',focuslabel);
    });
    $timeout.flush();
  });

  it('should not set focus label if _nextLabelToFocusOn is set', function() {
    FocusManagerService.setFocusLabel(focuslabel);
    ctr = FocusManagerService.setFocus(focuslabel);
    expect(ctr).toEqual(undefined);
  });

  it('should set label to clear focus and broadcast it', function() {
    FocusManagerService.clearFocus();
    $timeout(function () {
      expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn',clearLabel);
    });
    $timeout.flush();
  });

  it('should set focus label if on desktop and broadcast it', function() {
    FocusManagerService.setFocusIfOnDesktop(focuslabel);
    if (!DeviceInfoService.isMobileDevice()) {
      $timeout(function () {
        expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn',focuslabel);
      });
      $timeout.flush();
    }
  });
});
