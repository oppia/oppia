// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for navigating the top navigation bar with
 * tab and shift-tab.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  activeMenuName: '';
  static ACTION_OPEN: 'open';
  static ACTION_CLOSE: 'close';
  static KEYBOARD_EVENT_TO_KEY_CODES: {
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
  navigation = {
    activeMenuName: '',
    ACTION_OPEN: 'open',
    ACTION_CLOSE: 'close',
    KEYBOARD_EVENT_TO_KEY_CODES: {
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
    },
    openSubmenu: null,
    closeSubmenu: null,
    onMenuKeypress: null
  };

  /**
  * Opens the submenu.
  * @param {object} evt
  * @param {String} menuName - name of menu, on which
  * open/close action to be performed (category,language).
  */
  openSubmenu(evt: Event, menuName: string): void {
    // Focus on the current target before opening its submenu.
    this.navigation.activeMenuName = menuName;
    angular.element(evt.currentTarget).focus();
  }

  closeSubmenu(evt: { currentTarget }): void {
    this.navigation.activeMenuName = '';
    angular.element(evt.currentTarget).closest('li')
      .find('a').blur();
  }
  /**
   * Handles keydown events on menus.
   * @param {object} evt
   * @param {String} menuName - name of menu to perform action
   * on(category/language)
   * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
   * corresponding actions to be performed(open/close).
   *
   * @example
   *  onMenuKeypress($event, 'category', {enter: 'open'})
   */
  onMenuKeypress(
      evt: { keyCode: string; shiftKey: string; },
      menuName: string, eventsTobeHandled: Event): void {
    var targetEvents = Object.keys(eventsTobeHandled);
    for (var i = 0; i < targetEvents.length; i++) {
      var keyCodeSpec =
        this.navigation.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
      if (keyCodeSpec.keyCode === evt.keyCode &&
        evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
        if (
          eventsTobeHandled[targetEvents[i]] === this.navigation.ACTION_OPEN) {
          this.navigation.openSubmenu(evt, menuName);
        } else if (eventsTobeHandled[targetEvents[i]] ===
          this.navigation.ACTION_CLOSE) {
          this.navigation.closeSubmenu(evt);
        } else {
          throw new Error('Invalid action type.');
        }
      }
    }
  }
}
angular.module('oppia').factory('navigationService',
  downgradeInjectable(NavigationService));
