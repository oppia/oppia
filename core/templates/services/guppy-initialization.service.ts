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

  init(
    guppyDivClassName: string,
    placeholderText: string,
    initialValue = ''
  ): void {
    this.onScreenKeyboardShown = false;
    let guppyDivs = document.querySelectorAll('.' + guppyDivClassName);
    let divId, guppyInstance;
    let mathInteractionsService = new MathInteractionsService();
    for (let i = 0; i < guppyDivs.length; i++) {
      divId = 'guppy_' + Math.floor(Math.random() * 100000000);
      // Dynamically assigns a unique id to the guppy div.
      guppyDivs[i].setAttribute('id', divId);
      // Create a new guppy instance for that div.
      guppyInstance = new Guppy(divId, {});

      guppyInstance.configure(
        'empty_content',
        '\\color{grey}{\\text{\\small{' + placeholderText + '}}}'
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
      this.guppyInstances.push(new GuppyObject(divId, guppyInstance));
    }
  }

  findActiveGuppyObject(): GuppyObject | undefined {
    let activeId = $('.guppy_active').attr('id');
    for (let guppyObject of this.guppyInstances) {
      if (guppyObject.divId === activeId) {
        return guppyObject;
      }
    }
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
