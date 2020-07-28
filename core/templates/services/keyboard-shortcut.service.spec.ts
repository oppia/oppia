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

import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';

describe('KeyboardShortcutService', () => {
  var skipButton = document.createElement('button');
  var nextButton = document.createElement('button');
  var continueToNextCardButton = document.createElement('button');
  var continueButton = document.createElement('button');
  var backButton = document.createElement('button');
  var searchBar = document.createElement('input');
  var categoryBar = document.createElement('select');

  const keyboardShortcutService = new KeyboardShortcutService();

  beforeAll(() => {
    skipButton.setAttribute('id', 'skipToMainContentId');
    backButton.setAttribute('id', 'backButtonId');
    nextButton.setAttribute('class', 'protractor-test-next-button');
    continueButton.setAttribute('class', 'protractor-test-continue-button');
    continueToNextCardButton.setAttribute(
      'class', 'protractor-test-continue-to-next-card-button');
    searchBar.setAttribute(
      'class', 'protractor-test-search-input');
    categoryBar.setAttribute('id', 'categoryBar');
    document.body.append(skipButton);
    document.body.append(continueButton);
    document.body.append(backButton);
    document.body.append(searchBar);
    document.body.append(categoryBar);
  });

  it('should test navigation shortcuts.', () => {
    var getStartedShortcutTriggered = false;
    var libraryShortcutTriggered = false;
    var learnerShortcutTriggered = false;
    var creatorShortcutTriggered = false;
    var preferencesShortcutTriggered = false;
    var aboutShortcutTriggered = false;
    var notificationShortcutTriggered = false;

    keyboardShortcutService.setHref('#foo');
    const reloadSpy = jasmine.createSpy('reload');
    spyOn(keyboardShortcutService, 'setHref').and.callFake(function(href) {
      if(href == '/get-started') {
        getStartedShortcutTriggered = true;
      } else if (href == '/community-library') {
        learnerShortcutTriggered = true;
      } else if (href =='/learner-dashboard') {
        libraryShortcutTriggered = true;
      } else if (href == '/creator-dashboard') {
        creatorShortcutTriggered = true;
      } else if (href == '/preferences') {
        preferencesShortcutTriggered = true;
      } else if (href == '/about') {
        aboutShortcutTriggered = true;
      } else if (href =='/notifications') {
        notificationShortcutTriggered = true;
      }
    })
    keyboardShortcutService.bindNavigationShortcuts();
    Mousetrap.trigger('ctrl+0');
    Mousetrap.trigger('ctrl+1');
    Mousetrap.trigger('ctrl+2');
    Mousetrap.trigger('ctrl+3');
    Mousetrap.trigger('ctrl+4');
    Mousetrap.trigger('ctrl+5');
    Mousetrap.trigger('ctrl+6');
    expect(getStartedShortcutTriggered).toBe(true);
    expect(libraryShortcutTriggered).toBe(true);
    expect(learnerShortcutTriggered).toBe(true);
    expect(creatorShortcutTriggered).toBe(true);
    expect(preferencesShortcutTriggered).toBe(true);
    expect(aboutShortcutTriggered).toBe(true);
    expect(notificationShortcutTriggered).toBe(true);
  });

  it('should test library page action shortcuts', () => {
    keyboardShortcutService.bindLibraryPageShortcuts();

    Mousetrap.trigger('s');
    expect(skipButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('/');
    expect(searchBar.isEqualNode(document.activeElement));

    Mousetrap.trigger('c');
    expect(categoryBar.isEqualNode(document.activeElement));
  });

  it('should test exploration player action shortcuts', () => {
    keyboardShortcutService.bindExplorationPlayerShortcuts();

    Mousetrap.trigger('s');
    expect(skipButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('k');
    expect(backButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('j');
    expect(continueButton.isEqualNode(document.activeElement));

    document.body.append(continueToNextCardButton);
    Mousetrap.trigger('j');
    expect(continueToNextCardButton.isEqualNode(document.activeElement));

    document.body.append(nextButton);
    Mousetrap.trigger('j');
    expect(nextButton.isEqualNode(document.activeElement));
  });
});
