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
 * @fileoverview Unit tests for the keyboard shortcut service.
 */
import 'mousetrap';

import { KeyboardShortcutService } from 'services/KeyboardShortcutService';

describe('KeyboardShortcutService', () => {
  jasmine.getEnv().allowRespy(true);
  const keyboardShortcutService = new KeyboardShortcutService();

  it('should test navigation shortcuts.', () => {
    keyboardShortcutService.setHref('#foo');
    const reloadSpy = jasmine.createSpy('reload');
    spyOn(keyboardShortcutService, 'setHref').and.returnValue(null);
    keyboardShortcutService.bindNavigationShortcuts();
    Mousetrap.trigger('ctrl+0');
    Mousetrap.trigger('ctrl+1');
    Mousetrap.trigger('ctrl+2');
    Mousetrap.trigger('ctrl+3');
    Mousetrap.trigger('ctrl+4');
    Mousetrap.trigger('ctrl+5');
    Mousetrap.trigger('ctrl+6');
  });

  it('should test library page action shortcuts', () => {
    spyOn(document, 'getElementById').and.callFake(function() {
      return document.createElement('button1');
    });

    spyOn(document, 'querySelector').and.callFake(function() {
      return document.createElement('button2');
    });
    keyboardShortcutService.bindLibraryPageShortcuts();
    Mousetrap.trigger('s');
    Mousetrap.trigger('/');
    Mousetrap.trigger('c');
  });

  it('should test exploration player action shortcuts', () => {
    spyOn(document, 'getElementById').and.callFake(function() {
      return document.createElement('button1');
    });

    spyOn(document, 'querySelector').and.callFake(function() {
      return document.createElement('button2');
    });
    keyboardShortcutService.bindExplorationPlayerShortcuts();
    Mousetrap.trigger('s');
    Mousetrap.trigger('j');
    Mousetrap.trigger('k');
  });
});
