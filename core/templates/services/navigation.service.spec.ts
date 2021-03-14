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

import { TestBed } from '@angular/core/testing';
import { NavigationService } from './navigation.service';

describe('Navigation Service', () => {
  let navigationService: NavigationService;

  beforeEach(() => {
    navigationService = TestBed.get(NavigationService);
  });
  var angularElementSpy: jasmine.Spy<JQueryStatic>;
  var element = {
    focus: () => {},
    closest: () => {}
  };
  var closestReturn = {
    find: () => {}
  };
  var findReturn = {
    blur: () => {}
  };
  var focusAngularElementSpy;
  var blurAngularElementSpy;

  beforeEach(() => {
    // This throws "Argument of type '{ focus: () => void; closest: ()
    // => void; }' is not assignable to parameter of type 'JQLite'."
    // This is because 'JQLite' has around 150 more properties.
    // We have only defined the properties we need in 'element'.
    // @ts-expect-error
    angularElementSpy = spyOn(angular, 'element').and.returnValue(element);
    focusAngularElementSpy = spyOn(element, 'focus').and.callThrough();
    blurAngularElementSpy = spyOn(findReturn, 'blur').and.callThrough();

    spyOn(element, 'closest').and.callFake(() => {
      return closestReturn;
    });
    spyOn(closestReturn, 'find').and.callFake(() => {
      return findReturn;
    });
  });

  it('should open and close submenu', () => {
    var mockEvent = {
      currentTarget: null
    };

    navigationService.openSubmenu(mockEvent, 'New menu');
    expect(angularElementSpy).toHaveBeenCalledWith(mockEvent.currentTarget);
    expect(focusAngularElementSpy).toHaveBeenCalled();
    expect(navigationService.activeMenuName).toBe('New menu');

    navigationService.closeSubmenu(mockEvent);
    expect(angularElementSpy).toHaveBeenCalledWith(mockEvent.currentTarget);
    expect(blurAngularElementSpy).toHaveBeenCalled();
    expect(navigationService.activeMenuName).toBe('');
  });

  it('should open submenu when event has open action type', () => {
    var mockEvent = {
      keyCode: 13,
      shiftKey: false
    };
    var eventsTobeHandled = {
      enter: 'open'
    };

    var openSubmenuSpy = spyOn(navigationService, 'openSubmenu')
      .and.callThrough();
    navigationService.onMenuKeypress(mockEvent, 'New menu', eventsTobeHandled);
    expect(openSubmenuSpy).toHaveBeenCalled();
  });

  it('should close submenu when event has close action type', () => {
    var mockEvent = {
      keyCode: 9,
      shiftKey: true
    };
    var eventsTobeHandled = {
      shiftTab: 'close'
    };

    var closeSubmenuSpy = spyOn(navigationService, 'closeSubmenu').and
      .callThrough();
    navigationService.onMenuKeypress(mockEvent, 'New menu', eventsTobeHandled);
    expect(closeSubmenuSpy).toHaveBeenCalled();
  });

  it('should throw an error when event has invalid action type', () => {
    var mockEvent = {
      keyCode: 9,
      shiftKey: true
    };
    var eventsTobeHandled = {
      shiftTab: 'invalid'
    };

    expect(() => {
      navigationService.onMenuKeypress(
        mockEvent, 'New menu', eventsTobeHandled);
    }).toThrowError('Invalid action type.');
  });
});
