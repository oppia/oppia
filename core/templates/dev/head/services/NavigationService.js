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
 * @fileoverview Factory for navigating the top navigation bar with
 * tab and shift-tab.
 */
oppia.factory('NavigationService', [function() {
  var navigation = {};
  navigation.activeMenuName = '';
  navigation.ACTION_OPEN = 'open';
  navigation.ACTION_CLOSE = 'close';
  navigation.KEYBOARD_EVENT_TO_KEY_CODES = {
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
  /**
  * Opens the submenu.
  * @param {object} evt
  * @param {String} menuName - name of menu, on which
  * open/close action to be performed (category,language).
  */
  navigation.openSubmenu = function(evt, menuName) {
    // Focus on the current target before opening its submenu.
    navigation.activeMenuName = menuName;
    angular.element(evt.currentTarget).focus();
  };
  navigation.closeSubmenu = function(evt) {
    navigation.activeMenuName = '';
    angular.element(evt.currentTarget).closest('li')
      .find('a').blur();
  };
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
  navigation.onMenuKeypress = function(evt, menuName, eventsTobeHandled) {
    var targetEvents = Object.keys(eventsTobeHandled);
    for (var i = 0; i < targetEvents.length; i++) {
      var keyCodeSpec =
        navigation.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
      if (keyCodeSpec.keyCode === evt.keyCode &&
        evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
        if (eventsTobeHandled[targetEvents[i]] === navigation.ACTION_OPEN) {
          navigation.openSubmenu(evt, menuName);
        } else if (eventsTobeHandled[targetEvents[i]] ===
          navigation.ACTION_CLOSE) {
          navigation.closeSubmenu(evt);
        } else {
          throw Error('Invalid action type.');
        }
      }
    }
  };
  return navigation;
}]);
