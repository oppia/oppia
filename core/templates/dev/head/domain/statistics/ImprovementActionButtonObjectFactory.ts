// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Domain objects for the buttons creators may click to attempt to
 * resolve a particular improvement suggestion.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class ImprovementActionButton {
  _text: string;
  _cssClass: string;
  _actionFunc: () => void;
  _enabledFunc: () => boolean;

  /**
   * @constructor
   * @param text - The text displayed on the button.
   * @param cssClass - The CSS class to render the button with.
   * @param actionFunc - Function to run when the button is clicked.
   * @param enabledFunc - Function which returns whether this button should be
   *    enabled and clickable.
   */
  constructor(
      text: string, cssClass: string, actionFunc: () => void,
      enabledFunc?: () => boolean) {
    this._text = text;
    this._cssClass = cssClass;
    this._actionFunc = actionFunc;
    this._enabledFunc = enabledFunc;
  }

  /** Returns the text of the action (text rendered in button). */
  getText(): string {
    return this._text;
  }

  /** Returns the CSS class of the button. */
  getCssClass(): string {
    return this._cssClass;
  }

  /** Returns whether the button should be enabled and clickable. */
  isEnabled(): boolean {
    return this._enabledFunc ? this._enabledFunc() : true;
  }

  /** Performs the associated action. */
  execute(): void {
    this._actionFunc();
  }
}

@Injectable({
  providedIn: 'root'
})
export class ImprovementActionButtonObjectFactory {
  /**
   * @param text - The text displayed on the button.
   * @param cssClass - The CSS class to render the button with.
   * @param actionFunc - Function to run when the button is clicked.
   * @param enabledFunc - Function which returns whether this button should be
   *    enabled and clickable.
   */
  createNew(
      text: string, cssClass: string, actionFunc: () => void,
      enabledFunc?: () => boolean): ImprovementActionButton {
    return new ImprovementActionButton(text, cssClass, actionFunc, enabledFunc);
  }
}

angular.module('oppia').factory(
  'ImprovementActionButtonObjectFactory',
  downgradeInjectable(ImprovementActionButtonObjectFactory));
