// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for navigating the top navigation bar with
 * tab and shift-tab.
 */

import {Injectable} from '@angular/core';

interface KeyFunc {
  shiftKeyIsPressed: boolean;
  keyCode: number;
}

interface KeyboardEventToCodes {
  [keys: string]: KeyFunc;
  enter: {
    shiftKeyIsPressed: boolean;
    keyCode: number;
  };
  tab: {
    shiftKeyIsPressed: boolean;
    keyCode: number;
  };
  shiftTab: {
    shiftKeyIsPressed: boolean;
    keyCode: number;
  };
}

export interface EventToCodes {
  [keys: string]: string;
  enter: string;
  tab: string;
  shiftTab: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeMenuName!: string;
  ACTION_OPEN: string = 'open';
  ACTION_CLOSE: string = 'close';
  KEYBOARD_EVENT_TO_KEY_CODES: KeyboardEventToCodes = {
    enter: {
      shiftKeyIsPressed: false,
      keyCode: 13,
    },
    tab: {
      shiftKeyIsPressed: false,
      keyCode: 9,
    },
    shiftTab: {
      shiftKeyIsPressed: true,
      keyCode: 9,
    },
  };

  constructor() {}

  /**
   * Opens the submenu.
   * @param {object} evt
   * @param {String} menuName - name of menu, on which
   * open/close action to be performed (category,language).
   */
  openSubmenu(evt: KeyboardEvent, menuName: string): void {
    // Focus on the current target before opening its submenu.
    this.activeMenuName = menuName;
  }

  closeSubmenu(evt: KeyboardEvent): void {
    this.activeMenuName = '';
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
    evt: KeyboardEvent,
    menuName: string,
    eventsTobeHandled: EventToCodes
  ): void {
    let targetEvents = Object.keys(eventsTobeHandled);
    for (let i = 0; i < targetEvents.length; i++) {
      let keyCodeSpec = this.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
      if (
        keyCodeSpec.keyCode === evt.keyCode &&
        evt.shiftKey === keyCodeSpec.shiftKeyIsPressed
      ) {
        if (eventsTobeHandled[targetEvents[i]] === this.ACTION_OPEN) {
          this.openSubmenu(evt, menuName);
        } else if (eventsTobeHandled[targetEvents[i]] === this.ACTION_CLOSE) {
          this.closeSubmenu(evt);
        } else {
          throw new Error('Invalid action type.');
        }
      }
    }
  }
}
