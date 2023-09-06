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
import Mousetrap from 'mousetrap';

import { ApplicationRef } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { KeyboardShortcutHelpModalComponent } from
  // eslint-disable-next-line max-len
  'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';

class MockActiveModal {
  dismiss(): void {
    return;
  }
}
describe('Keyboard Shortcuts', () => {
  let skipButton = document.createElement('button');
  let nextButton = document.createElement('button');
  let continueButton = document.createElement('button');
  let backButton = document.createElement('button');
  let searchBar = document.createElement('input');
  let categoryBar = document.createElement('select');

  let openQuickReferenceSpy;

  let mockWindow = {
    location: {
      href: ''
    }
  } as Window;

  let windowRef: WindowRef;
  let appRef: ApplicationRef;
  let keyboardShortcutService: KeyboardShortcutService;
  let ngbModal: NgbModal;


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KeyboardShortcutHelpModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    }).compileComponents();
  }));

  beforeEach(async() => {
    ngbModal = TestBed.get(NgbModal);
    windowRef = new WindowRef();
    appRef = TestBed.get(ApplicationRef);
    keyboardShortcutService = new KeyboardShortcutService(
      windowRef,
      ngbModal,
      appRef
    );
  });

  beforeAll(() => {
    skipButton.setAttribute('class', 'oppia-skip-to-content');
    backButton.setAttribute('class', 'oppia-back-button');
    nextButton.setAttribute('class', 'oppia-next-button');
    continueButton.setAttribute('class', 'oppia-learner-confirm-button');
    searchBar.setAttribute('class', 'oppia-search-bar-text-input');
    categoryBar.setAttribute('class', 'oppia-search-bar-dropdown-toggle');
    document.body.append(skipButton);
    document.body.append(continueButton);
    document.body.append(backButton);
    document.body.append(searchBar);
    document.body.append(categoryBar);
  });


  it('should navigate to the corresponding page' +
    ' when the navigation key is pressed', () => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue(mockWindow);
    keyboardShortcutService.bindNavigationShortcuts();

    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');

    Mousetrap.trigger('ctrl+6');
    expect(windowRef.nativeWindow.location.href).toEqual('/get-started');
    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');

    Mousetrap.trigger('ctrl+1');
    expect(windowRef.nativeWindow.location.href).toEqual('/community-library');
    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');

    Mousetrap.trigger('ctrl+2');
    expect(windowRef.nativeWindow.location.href).toEqual('/learner-dashboard');
    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');

    Mousetrap.trigger('ctrl+3');
    expect(windowRef.nativeWindow.location.href).toEqual('/creator-dashboard');
    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');

    Mousetrap.trigger('ctrl+4');
    expect(windowRef.nativeWindow.location.href).toEqual('/about');
    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');

    Mousetrap.trigger('ctrl+5');
    expect(windowRef.nativeWindow.location.href).toEqual('/preferences');
    mockWindow.location.href = '';
    expect(windowRef.nativeWindow.location.href).toBe('');
  });

  it('should move the focus to the corresponding element' +
    ' when the action key is pressed', () => {
    openQuickReferenceSpy = spyOn(
      keyboardShortcutService, 'openQuickReference').and.callThrough();
    spyOn(ngbModal, 'open');
    spyOn(ngbModal, 'dismissAll');
    spyOn(appRef, 'tick');

    keyboardShortcutService.bindLibraryPageShortcuts();

    Mousetrap.trigger('s');
    expect(skipButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('/');
    expect(searchBar.isEqualNode(document.activeElement));

    Mousetrap.trigger('c');
    expect(categoryBar.isEqualNode(document.activeElement));

    Mousetrap.trigger('?');
    expect(openQuickReferenceSpy).toHaveBeenCalled();

    keyboardShortcutService.bindExplorationPlayerShortcuts();

    Mousetrap.trigger('s');
    expect(skipButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('k');
    expect(backButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('j');
    expect(continueButton.isEqualNode(document.activeElement));

    document.body.append(nextButton);
    Mousetrap.trigger('j');
    expect(nextButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('?');
    expect(openQuickReferenceSpy).toHaveBeenCalled();

    Mousetrap.trigger('left');
    expect(backButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('right');
    expect(nextButton.isEqualNode(document.activeElement));
  });
});
