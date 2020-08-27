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
import 'mousetrap';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service.ts';


@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  constructor(private windowRef: WindowRef) {}
  bindExplorationPlayerShortcuts(): void {
    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
    });

    Mousetrap.bind('k', function() {
      var previousButton = document.getElementById('backButtonId');
      if (previousButton !== null) {
        previousButton.focus();
      }
    });

    Mousetrap.bind('j', function() {
      var nextButton = <HTMLElement>document.querySelector(
        '.oppia-next-button');
      var continueButton = <HTMLElement>document.querySelector(
        '.oppia-learner-confirm-button');
      if (nextButton !== null) {
        nextButton.focus();
      }
      if (continueButton !== null) {
        continueButton.focus();
      }
    });
  }

  bindLibraryPageShortcuts(): void {
    Mousetrap.bind('/', function() {
      var searchBar = <HTMLElement>document.querySelector(
        '.oppia-search-bar-text-input');
      searchBar.focus();
      return false;
    });

    Mousetrap.bind('c', function() {
      var categoryBar = <HTMLElement>document.querySelector(
        '.oppia-search-bar-dropdown-toggle');
      categoryBar.focus();
    });

    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
    });
  }


  bindNavigationShortcuts(): void {
    Mousetrap.bind('ctrl+0', () => {
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
      this.windowRef.nativeWindow.location.href = '/notifications';
    });

    Mousetrap.bind('ctrl+6', () => {
      this.windowRef.nativeWindow.location.href = '/preferences';
    });
  }
}

angular.module('oppia').factory(
  'KeyboardShortcutService', downgradeInjectable(KeyboardShortcutService));
