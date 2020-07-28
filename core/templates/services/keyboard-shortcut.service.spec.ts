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

describe('Keyboard Shortcuts', () => {
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

  it('should navigate to the corresponding page' +
    ' when the navigation key is pressed', () => {
    var hrefValue = '';

    keyboardShortcutService.setHref('#foo');
    spyOn(keyboardShortcutService, 'setHref').and.callFake(function(href) {
      hrefValue = href;
    });
    keyboardShortcutService.bindNavigationShortcuts();
    
    Mousetrap.trigger('ctrl+0');
    expect(hrefValue).toEqual('/get-started');

    Mousetrap.trigger('ctrl+1');
    expect(hrefValue).toEqual('/community-library');

    Mousetrap.trigger('ctrl+2');
    expect(hrefValue).toEqual('/learner-dashboard');

    Mousetrap.trigger('ctrl+3');
    expect(hrefValue).toEqual('/creator-dashboard');

    Mousetrap.trigger('ctrl+4');
    expect(hrefValue).toEqual('/about');

    Mousetrap.trigger('ctrl+5');
    expect(hrefValue).toEqual('/notifications');

    Mousetrap.trigger('ctrl+6');
    expect(hrefValue).toEqual('/preferences');
  });

  it('should move the focus to the corresponding element' + 
    ' when the action key is pressed', () => {
    keyboardShortcutService.bindLibraryPageShortcuts();

    Mousetrap.trigger('s');
    expect(skipButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('/');
    expect(searchBar.isEqualNode(document.activeElement));

    Mousetrap.trigger('c');
    expect(categoryBar.isEqualNode(document.activeElement));

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
