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
import { EventToCodes, NavigationService } from './navigation.service';

describe('Navigation Service', () => {
  let navigationService: NavigationService;
  let element = {
    focus: () => {},
    closest: () => {}
  };
  let closestReturn = {
    find: () => {}
  };
  let findReturn = {
    blur: () => {}
  };

  beforeEach(() => {
    navigationService = TestBed.inject(NavigationService);
    navigationService.KEYBOARD_EVENT_TO_KEY_CODES = {
      enter: {
        shiftKeyIsPressed: false,
        keyCode: 13
      },
      tab: {
        shiftKeyIsPressed: false,
        keyCode: 9
      },
      shiftTab: {
        shiftKeyIsPressed: true,
        keyCode: 9
      }
    };
    navigationService.ACTION_OPEN = 'open';
    navigationService.ACTION_CLOSE = 'close';
    spyOn(element, 'closest').and.callFake(() => {
      return closestReturn;
    });
    spyOn(closestReturn, 'find').and.callFake(() => {
      return findReturn;
    });
  });

  it('should open submenu when event has open action type', () => {
    let mockEvent = {
      keyCode: 13,
      shiftKey: false
    } as KeyboardEvent;
    let eventsTobeHandled = {
      enter: 'open'
    } as EventToCodes;

    let openSubmenuSpy = spyOn(navigationService, 'openSubmenu')
      .and.callThrough();
    navigationService.onMenuKeypress(
      mockEvent, 'New menu', eventsTobeHandled);
    expect(openSubmenuSpy).toHaveBeenCalled();
  });

  it('should close submenu when event has close action type', () => {
    let mockEvent = {
      keyCode: 9,
      shiftKey: true
    } as KeyboardEvent;
    let eventsTobeHandled = {
      shiftTab: 'close',
    } as EventToCodes;
    let closeSubmenuSpy = spyOn(navigationService, 'closeSubmenu').and
      .callThrough();
    navigationService.onMenuKeypress(mockEvent, 'New menu', eventsTobeHandled);
    expect(closeSubmenuSpy).toHaveBeenCalled();
  });

  it('should throw an error when event has invalid action type', () => {
    let mockEvent = {
      keyCode: 9,
      shiftKey: true
    } as KeyboardEvent;
    let eventsTobeHandled = {
      shiftTab: 'invalid'
    } as EventToCodes;

    expect(() => {
      navigationService.onMenuKeypress(
        mockEvent, 'New menu', eventsTobeHandled);
    }).toThrowError('Invalid action type.');
  });
});
