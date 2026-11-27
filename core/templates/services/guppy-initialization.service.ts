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
 * @fileoverview Service for initializing guppy instances.
 */

import {Injectable} from '@angular/core';

import {MathInteractionsService} from 'services/math-interactions.service';
import {
  KNOWN_CSS,
  LazyCssLoaderService,
} from 'services/lazy-css-loader.service';

export class GuppyObject {
  // These properties are initialized using constructor function
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  divId!: string;
  guppyInstance!: Guppy;
  constructor(divId: string, guppyInstance: Guppy) {
    this.divId = divId;
    this.guppyInstance = guppyInstance;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GuppyInitializationService {
  private guppyInstances: GuppyObject[] = [];
  private onScreenKeyboardShown = false;
  static interactionType: string;
  private static allowedVariables: string[] = [];
  private static tabKeyListenerIsAdded = false;

  constructor(private lazyCssLoaderService: LazyCssLoaderService) {}

  init(
    guppyDivClassName: string,
    placeholderText: string,
    initialValue = ''
  ): void {
    this.onScreenKeyboardShown = false;
    let guppyDivs = document.querySelectorAll('.' + guppyDivClassName);
    let divId, guppyInstance;
    let mathInteractionsService = new MathInteractionsService();
    // Guppy editors can be rendered on any page that embeds a math
    // interaction or editor, such as the question-suggestion flows and the
    // certificate assessment player. Loading the stylesheet here, before the
    // Guppy instances are created, keeps those pages styled without having to
    // load the CSS on every page root. The loader deduplicates repeated calls.
    this.lazyCssLoaderService.loadCss(KNOWN_CSS.GUPPY);
    for (let i = 0; i < guppyDivs.length; i++) {
      divId = 'guppy_' + Math.floor(Math.random() * 100000000);
      // Dynamically assigns a unique id to the guppy div.
      guppyDivs[i].setAttribute('id', divId);
      // Create a new guppy instance for that div.
      guppyInstance = new Guppy(divId, {});

      guppyInstance.configure(
        'empty_content',
        '\\color{grey}{\\small \\text{' + placeholderText + '}}'
      );

      // Initialize it with a value for the creator's view.
      if (initialValue.length !== 0) {
        if (initialValue.indexOf('=') !== -1) {
          let splitByEquals = initialValue.split('=');
          splitByEquals[0] = mathInteractionsService.insertMultiplicationSigns(
            splitByEquals[0]
          );
          splitByEquals[1] = mathInteractionsService.insertMultiplicationSigns(
            splitByEquals[1]
          );
          initialValue = splitByEquals.join('=');
        } else {
          initialValue =
            mathInteractionsService.insertMultiplicationSigns(initialValue);
        }
        initialValue = initialValue.replace(/abs\(/g, 'absolutevalue(');
        initialValue = initialValue.replace(/sqrt\(/g, 'squareroot(');
        guppyInstance.import_text(initialValue);
        guppyInstance.engine.end();
        guppyInstance.render(true);
      }
      this.makeEditorKeyboardAccessible(
        guppyDivs[i] as HTMLElement,
        guppyInstance
      );
      this.guppyInstances.push(new GuppyObject(divId, guppyInstance));
    }
  }

  // Guppy gives every editor a positive tabindex, which takes the editor out
  // of the page's normal tab order, so reset it. Since Tab now moves focus
  // out of the editor, activate the editor again when it is tabbed back into.
  // See #27768.
  private makeEditorKeyboardAccessible(
    guppyDiv: HTMLElement,
    guppyInstance: Guppy
  ): void {
    guppyDiv.tabIndex = 0;
    guppyDiv.addEventListener('focus', () => {
      if (Guppy.active_guppy !== guppyInstance) {
        guppyInstance.activate();
      }
    });
    GuppyInitializationService.letTabKeyLeaveGuppy();
  }

  // Guppy's document-level key handler cancels the Tab key while an editor
  // is active, which traps keyboard users in the editor (#27768). This
  // listener runs before that handler and deactivates the editor, in the same
  // way as when the user clicks outside of it. Guppy's handler then ignores
  // the key, so the browser moves focus as usual.
  private static letTabKeyLeaveGuppy(): void {
    if (GuppyInitializationService.tabKeyListenerIsAdded) {
      return;
    }
    document.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !Guppy.active_guppy) {
          return;
        }
        Guppy.active_guppy.deactivate();
        Guppy.active_guppy = null;
      },
      true
    );
    GuppyInitializationService.tabKeyListenerIsAdded = true;
  }

  findActiveGuppyObject(): GuppyObject | undefined {
    const activeElement = document.querySelector('.guppy_active');
    const activeId = activeElement ? activeElement.id : null;

    if (activeId) {
      for (let guppyObject of this.guppyInstances) {
        if (guppyObject.divId === activeId) {
          return guppyObject;
        }
      }
    }
  }

  activate(): void {
    if (this.guppyInstances.length === 0) {
      return;
    }
    const mostRecentGuppyObject =
      this.guppyInstances[this.guppyInstances.length - 1];
    mostRecentGuppyObject.guppyInstance.activate();
  }

  getShowOSK(): boolean {
    return this.onScreenKeyboardShown;
  }

  setShowOSK(value: boolean): void {
    this.onScreenKeyboardShown = value;
  }

  getAllowedVariables(): string[] {
    return GuppyInitializationService.allowedVariables;
  }

  setAllowedVariables(allowedVariables: string[]): void {
    GuppyInitializationService.allowedVariables = allowedVariables;
  }
}
