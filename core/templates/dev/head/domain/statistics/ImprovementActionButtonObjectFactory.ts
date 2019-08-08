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
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_actionFunc' is a function with varying return types
  // depending upon the arguments paased to the constructor of
  // 'ImprovementActionButton'.
  _actionFunc: any;

  /**
   * @constructor
   * @param {string} text - The text displayed on the button.
   * @param {callback} actionFunc - Function to run when the button is clicked.
   * @param {string} [cssClass=btn-default] - The CSS class to render the button
   *    with.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_actionFunc' is a function with varying return types
  // depending upon the arguments paased to the constructor of
  // 'ImprovementActionButton'.
  constructor(text: string, cssClass: string, actionFunc: any) {
    this._text = text;
    this._cssClass = cssClass;
    this._actionFunc = actionFunc;
  }
  /** @returns {string} - The text of the action (text rendered in button). */
  getText(): string {
    return this._text;
  }

  /** Returns the CSS class of the button. */
  getCssClass(): string {
    return this._cssClass;
  }

  /** Performs the associated action and return its result. */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_actionFunc' is a function with varying return types
  // depending upon the arguments paased to the constructor of
  // 'ImprovementActionButton'.
  execute(): any {
    return this._actionFunc();
  }
}

@Injectable({
  providedIn: 'root'
})
export class ImprovementActionButtonObjectFactory {
  /**
   * @returns {ImprovementActionButton}
   * @param {string} text - The text displayed on the button.
   * @param {callback} actionFunc - Function to run when the button is
   *    clicked.
   * @param {string} [cssClass=btn-default] - The CSS class to render the
   *    button with.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_actionFunc' is a function with varying return types
  // depending upon the arguments paased to the constructor of
  // 'ImprovementActionButton'.
  createNew(text: string, actionFunc: any, cssClass: string) {
    return new ImprovementActionButton(text, actionFunc, cssClass);
  }
}

angular.module('oppia').factory(
  'ImprovementActionButtonObjectFactory',
  downgradeInjectable(ImprovementActionButtonObjectFactory));
