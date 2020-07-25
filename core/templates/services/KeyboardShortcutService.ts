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

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  bindExplorationPlayerShortcuts() {
    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
      return false;
    });

    Mousetrap.bind('k', function() {
      var previousButton = document.getElementById('backButtonId');
      if (previousButton !== null) {
        previousButton.focus();
      }
      return false;
    });

    Mousetrap.bind('j', function() {
      var nextButton = <HTMLElement>document.querySelector(
        '.protractor-test-next-button');
      if (nextButton !== null) {
        nextButton.focus();
      }
      return false;
    });
  }

  bindLibraryPageShortcuts() {
    Mousetrap.bind('/', function() {
      document.getElementById('searchBar').focus();
      return false;
    });

    Mousetrap.bind('c', function() {
      document.getElementById('categoryBar').focus();
      return false;
    });

    Mousetrap.bind('s', function() {
      document.getElementById('skipToMainContentId').focus();
      return false;
    });
  }

  bindNavigationShortcuts() {
    Mousetrap.bind('ctrl+0', function() {
      window.location.href = '/get-started';
    });

    Mousetrap.bind('ctrl+1', function() {
      window.location.href = '/community-library';
    });

    Mousetrap.bind('ctrl+2', function() {
      window.location.href = '/learner-dashboard';
    });

    Mousetrap.bind('ctrl+3', function() {
      window.location.href = '/creator-dashboard';
    });

    Mousetrap.bind('ctrl+4', function() {
      window.location.href = '/';
    });

    Mousetrap.bind('ctrl+5', function() {
      window.location.href = '/notifications';
    });

    Mousetrap.bind('ctrl+6', function() {
      window.location.href = '/preferences';
    });
  }
}

angular.module('oppia').factory(
  'KeyboardShortcutService', downgradeInjectable(KeyboardShortcutService));
