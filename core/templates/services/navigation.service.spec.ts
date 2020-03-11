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
 * @fileoverview Unit tests for NavigationService
 */

require('services/navigation.service.ts');

describe('Navigation Service', () => {
  var NavigationService = null;
  var angularElementSpy;
  var element = {
    focus: function() {},
    closest: function() {}
  };
  var closestReturn = {
    find: function() {}
  };
  var findReturn = {
    blur: function() {}
  };
  var focusAngularElementSpy;
  var blurAngularElementSpy;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    NavigationService = $injector.get('NavigationService');

    // @ts-ignore
    angularElementSpy = spyOn(angular, 'element').and.returnValue(element);
    focusAngularElementSpy = spyOn(element, 'focus').and.callThrough();
    blurAngularElementSpy = spyOn(findReturn, 'blur').and.callThrough();

    spyOn(element, 'closest').and.callFake(function() {
      return closestReturn;
    });
    spyOn(closestReturn, 'find').and.callFake(function() {
      return findReturn;
    });
  }));

  it('should open and close submenu', function() {
    var mockEvent = {
      currentTarget: null
    };

    NavigationService.openSubmenu(mockEvent, 'New menu');
    expect(angularElementSpy).toHaveBeenCalledWith(mockEvent.currentTarget);
    expect(focusAngularElementSpy).toHaveBeenCalled();
    expect(NavigationService.activeMenuName).toBe('New menu');

    NavigationService.closeSubmenu(mockEvent);
    expect(angularElementSpy).toHaveBeenCalledWith(mockEvent.currentTarget);
    expect(blurAngularElementSpy).toHaveBeenCalled();
    expect(NavigationService.activeMenuName).toBe('');
  });

  it('should open submenu when event has open action type', function() {
    var mockEvent = {
      keyCode: 13,
      shiftKey: false
    };
    var eventsTobeHandled = {
      enter: 'open'
    };

    var openSubmenuSpy = spyOn(NavigationService, 'openSubmenu')
      .and.callThrough();
    NavigationService.onMenuKeypress(mockEvent, 'New menu', eventsTobeHandled);
    expect(openSubmenuSpy).toHaveBeenCalled();
  });

  it('should close submenu when event has close action type', function() {
    var mockEvent = {
      keyCode: 9,
      shiftKey: true
    };
    var eventsTobeHandled = {
      shiftTab: 'close'
    };

    var closeSubmenuSpy = spyOn(NavigationService, 'closeSubmenu').and
      .callThrough();
    NavigationService.onMenuKeypress(mockEvent, 'New menu', eventsTobeHandled);
    expect(closeSubmenuSpy).toHaveBeenCalled();
  });

  it('should throw an error when event has invalid action type', function() {
    var mockEvent = {
      keyCode: 9,
      shiftKey: true
    };
    var eventsTobeHandled = {
      shiftTab: 'invalid'
    };

    expect(function() {
      NavigationService.onMenuKeypress(mockEvent, 'New menu',
        eventsTobeHandled);
    }).toThrow(Error('Invalid action type.'));
  });
});
