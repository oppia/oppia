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
 * @fileoverview Translate pipe for i18n translations.
 */

import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform }
  from '@angular/core';
import { Subscription } from 'rxjs';
import { LangChangeEvent, TranslateService } from 'services/translate.service';
import { UtilsService } from 'services/utils.service';

/**
 * Commonly used terms in this file.
 * Note: Intentionally left out the L of innerHTM"L" to avoid the linting error.
 * Example: <h1 [innerHTM]="'I18N_ABOUT_PAGE_HEADING' | translate:{x: 'val'}">
 * 'I18N_ABOUT_PAGE_HEADING' is referred here as key.
 * "translate" is the pipe. Every pipe must have a transform function. The
 * transform function is called when angular encouters the pipe in HTML.
 * The object following the pipe, i.e.{x: 'val'}, is another argument to the
 * transform function. This object is called params or interpolationParams.
 */

@Pipe({
  name: 'translate',
  // This option is required to update the value when promises are resolved.
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  interpolatedValue: string = '';
  lastKey: string;
  lastParams: Object | Array<Object>;
  onLangChange: Subscription;

  constructor(
    private translate: TranslateService,
    private _ref: ChangeDetectorRef,
    private utils: UtilsService
  ) {}

  /**
   * @param {string} key - key for i18n translation
   * @param {Object} interpolateParams - Params for interpolation
   */
  updateInterpolatedValue(key: string, interpolateParams?: Object): void {
    const interpolatedString = this.translate.getInterpolatedString(
      key, interpolateParams);

    // Using multiline ternary (https://eslint.org/docs/rules/multiline-ternary).
    this.interpolatedValue = interpolatedString !== undefined ?
    interpolatedString :
    key;

    // Storing the key to check if the key is same when the transform is invoked
    // again.
    this.lastKey = key;
    this._ref.markForCheck();
  }

  /**
   * @param {string} key - key for i18n
   * @param {Object} params - params for interpolation
   * @returns {string} - Interpolated I18n value
   */
  transform(key: string, params?: Object): string {
    if (!key || !key.length) {
      return key;
    }

    // If the key and params are same, return the last stored value.
    if (key === this.lastKey &&
          this.utils.isEquivalent(params, this.lastParams)) {
      return this.interpolatedValue;
    }

    let interpolateParams: Object;
    if (this.utils.isDefined(params)) {
      if (typeof params === 'object' && !Array.isArray(params)) {
        interpolateParams = params;
      }
    }

    // Storing the key to check if the key is same when the transform is invoked
    // again.
    this.lastKey = key;

    // Storing the params to check if the params are same when the transform is
    // invoked again.
    this.lastParams = params;

    // Update the interpolated value.
    this.updateInterpolatedValue(key, interpolateParams);

    // If there is a subscription to onLangChange, unsubscribe.
    this._dispose();
    // Subscribe to onLangChange event, in case the language changes.
    if (!this.onLangChange) {
      this.onLangChange = this.translate.onLangChange.subscribe(
        (event: LangChangeEvent) => {
          this.updateInterpolatedValue(key, interpolateParams);
        }
      );
    }
    return this.interpolatedValue;
  }

  /**
   * Clean up any existing subscription to change events
   */
  private _dispose(): void {
    if (typeof this.onLangChange === 'undefined') {
      return;
    }
    this.onLangChange.unsubscribe();
    this.onLangChange = undefined;
  }

  ngOnDestroy(): void {
    this._dispose();
  }
}
