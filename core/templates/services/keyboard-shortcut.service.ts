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
 * @fileoverview Keyboard shortcut service for Oppia webpages.
 */

import Mousetrap from 'mousetrap';
import {Injectable, ApplicationRef} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {KeyboardShortcutHelpModalComponent} from 'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutService {
  constructor(
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private appRef: ApplicationRef
  ) {}

  openQuickReference(): void {
    this.ngbModal.dismissAll();
    this.ngbModal.open(KeyboardShortcutHelpModalComponent, {backdrop: true});
    this.appRef.tick();
  }

  bindExplorationPlayerShortcuts(): void {
    Mousetrap.bind('s', () => {
      var skipButton = document.querySelector(
        '.oppia-skip-to-content'
      ) as HTMLElement;
      if (skipButton !== null) {
        skipButton.click();
      }
    });

    Mousetrap.bind('k', () => {
      var previousButton = document.querySelector(
        '.oppia-back-button'
      ) as HTMLElement;
      if (previousButton !== null) {
        previousButton.focus();
      }
    });

    Mousetrap.bind('j', () => {
      var nextButton = document.querySelector(
        '.oppia-next-button'
      ) as HTMLElement;
      var continueButton = document.querySelector(
        '.oppia-learner-confirm-button'
      ) as HTMLElement;
      if (nextButton !== null) {
        nextButton.focus();
      }
      if (continueButton !== null) {
        continueButton.focus();
      }
    });

    Mousetrap.bind('?', () => {
      this.openQuickReference();
    });

    Mousetrap.bind('left', () => {
      let previousButton = document.querySelector(
        '.oppia-back-button'
      ) as HTMLElement;
      if (previousButton !== null) {
        previousButton.click();
      }
    });

    Mousetrap.bind('right', () => {
      let nextButton = document.querySelector(
        '.oppia-next-button'
      ) as HTMLElement;
      if (nextButton !== null) {
        nextButton.click();
      }
    });
  }

  bindLibraryPageShortcuts(): void {
    Mousetrap.bind('/', () => {
      var searchBar = document.querySelector(
        '.oppia-search-bar-text-input'
      ) as HTMLElement;
      searchBar.focus();
      return false;
    });

    Mousetrap.bind('c', () => {
      var categoryBar = document.querySelector(
        '.oppia-search-bar-dropdown-toggle'
      ) as HTMLElement;
      categoryBar.focus();
    });

    Mousetrap.bind('s', () => {
      var skipButton = document.querySelector(
        '.oppia-skip-to-content'
      ) as HTMLElement;
      if (skipButton !== null) {
        skipButton.click();
      }
    });

    Mousetrap.bind('?', () => {
      this.openQuickReference();
    });
  }

  bindNavigationShortcuts(): void {
    Mousetrap.bind('ctrl+6', () => {
      this.windowRef.nativeWindow.location.href = '/get-started';
    });

    Mousetrap.bind('ctrl+1', () => {
      this.windowRef.nativeWindow.location.href = '/community-library';
    });

    Mousetrap.bind('ctrl+2', () => {
      this.windowRef.nativeWindow.location.href = '/learner-dashboard';
    });

    Mousetrap.bind('ctrl+3', () => {
      this.windowRef.nativeWindow.location.href = '/creator-dashboard';
    });

    Mousetrap.bind('ctrl+4', () => {
      this.windowRef.nativeWindow.location.href = '/about';
    });

    Mousetrap.bind('ctrl+5', () => {
      this.windowRef.nativeWindow.location.href = '/preferences';
    });
  }
}
