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
 * Commonly used terms in this file:
 *   key - Key for i18n translation
 *   interpolateParams or params - Key-value pairs for interpolation
 *   interpolatedValue - The final translation that is returned.
 *
 * Example: <h1 [innerHTM]="'I18N_ABOUT_PAGE_HEADING' | translate:{x: 'val'}">
 *   'I18N_ABOUT_PAGE_HEADING' is referred here as key.
 *
 *   "translate" is the pipe. Every pipe must have a transform function. The
 *   transform function is called when angular encounters the pipe in HTML.
 *
 *   The object following the pipe, i.e. {x: 'val'}, is another argument to the
 *   transform function. This object is called params or interpolationParams.
 *
 * Note: For every "| translate" angular encounters in the html, it creates a
 * separate instance of this pipe.
 */

@Pipe({
  name: 'translate',
  // This option is required to update the interpolatedValue when promises are
  // resolved.
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  interpolatedValue: string = '';
  /**
   * Variable to keep track of the last key sent for translation. If the
   * previously sent key and params are same as the current one, the pipe
   * doesn't request for translation and interpolation again.
   */
  lastKey: string = null;
  /**
   * Variable to keep track of the last param sent for translation. If the
   * previously sent key and params are same as the current one, the pipe
   * doesn't request for translation and interpolation again.
   */
  lastParams: Object;
  onLangChange: Subscription = null;

  constructor(
    private translateService: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
    private utilsService: UtilsService
  ) {}

  /**
   * Updates the value of interpolatedValue.
   * @param {string} key - key for i18n translation
   * @param {Object} interpolateParams - key-value pairs for interpolation
   */
  updateInterpolatedValue(key: string, interpolateParams?: Object): void {
    this.interpolatedValue = this.translateService.getInterpolatedString(
      key, interpolateParams);

    // Storing the key to check if the key is same when the transform is invoked
    // again.
    this.lastKey = key;

    // Storing the params to check if the params are same when the transform is
    // invoked again.
    this.lastParams = interpolateParams;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Every pipe is supposed to have a function named "transform". This is
   * because Pipes implement the PipeTransform interface. The PipeTransform
   * interface expects a function named "transform". This "transform" function
   * is called by angular to transform input values for display in a view.
   * @param {string} key - key for i18n
   * @param {Object | undefined} params - key-value pairs for interpolation. No
   *  key-value pairs are sent when the translation does not require
   *  interpolation. In that case the params will be undefined.
   * @returns {string} - interpolated I18n value
   */
  transform(key: string, params?: Object | undefined): string {
    if (!key || !key.length) {
      return key;
    }

    // If the key and params are same, return the last stored value.
    if (
      key === this.lastKey &&
      this.utilsService.isEquivalent(params, this.lastParams)) {
      return this.interpolatedValue;
    }

    // Storing the key to check if the key is same when the transform is invoked
    // again.
    this.lastKey = key;

    // Storing the params to check if the params are same when the transform is
    // invoked again.
    this.lastParams = params;

    let interpolateParams: Object;
    if (this.utilsService.isDefined(params) && !Array.isArray(params)) {
      interpolateParams = params;
    }

    // Update the interpolated value.
    this.updateInterpolatedValue(key, interpolateParams);

    // Subscribe to onLangChange event, in case the language changes.
    if (this.onLangChange === null) {
      this.onLangChange = this.translateService.onLangChange.subscribe(
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
  private disposeSubscriptions(): void {
    if (this.onLangChange === null) {
      return;
    }
    this.onLangChange.unsubscribe();
    this.onLangChange = null;
  }

  ngOnDestroy(): void {
    this.disposeSubscriptions();
  }
}
