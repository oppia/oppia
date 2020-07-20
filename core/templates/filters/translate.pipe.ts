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
    this.interpolatedValue = this.pluralizeInterpolatedValue(
      this.interpolatedValue, interpolateParams);

    // Storing the key to check if the key is same when the transform is invoked
    // again.
    this.lastKey = key;

    // Storing the params to check if the params are same when the transform is
    // invoked again.
    this.lastParams = interpolateParams;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Pluralizes the interpolatedValue.
   * @param {string} interpolatedValue - interpolated i18n value
   * @param {Object} pluralizationParams - key-value pair for pluralization
   *
   * A "superficial" function that covers all the exisiting usecases for
   *   pluralization.
   * For cases where we have translation where pluralization is requried.
   * Example:
   *   I18N_TOPIC_SUMMARY_TILE_LESSONS:
   *     {lessonCount, plural, =1{1 lesson} other{# lessons}}
   *
   * Used in topic-summary-tile.directive.html (lines 13 - 15):
   *   <span translate="I18N_TOPIC_SUMMARY_TILE_LESSONS"
   *    translate-values="
   *      {lessonCount: $ctrl.getTopicSummary().getCanonicalStoryCount()}"
   *      translate-interpolation="messageformat">
   *    </span>
   *
   * Alternatives:
   *   1. messageformat library: https://www.npmjs.com/package/messageformat
   *   Why not used:
   *     We only had one usecase (plural). messageformat has a lot
   *     functionality that is not required. The way to use messageformat is to
   *     require the library in code, can't use import. That would result in
   *     the entire library being bundled.
   *
   * Cases this function covers:
   *  1> =1{...}
   *    If the pluralization param is equal to 1 or '1', the function will
   *    replace that part of the content with the text inside "{ }".
   *  2> one{...}
   *    If the pluralization param is equal to 1 or '1', the function will
   *    replace that part of the content with the text inside "{ }".
   *    Incase both one{...} and =1{...}, =1{...} will be preferred.
   *  3> other{...}
   *    If the pluralization param doesn't match any of those above two cases,
   *    if will use the content inside other{...}. Any instance of "#" inside
   *    other{...} will be replaced with the value of pluralization param.
   * Does not supoort expressions like >, < or =.
   *
   * Possible breaking scenarios:
   * 1> When interpolationParams contain this pattern: {*, plural, ...}
   * Possible solutions:
   *   - Use the "not" interpolated string to find the occurance of
   *     "{*, plural, ...}" but replace the pluralizedValue in the
   *     interpolated string.
   *   - Check for such patterns in interpolation params and don't allow it.
   *
   * 2> Multiple pluralizations in a sentence:
   * Possible solution:
   *   - Do it recursively for each pattern using:
   *      sting.replace(regex, (
   *         substring: string, pluralizationKey: string) => {
   *        ...
   *      });
   */
  pluralizeInterpolatedValue(
      interpolatedValue: string, pluralizationParams: Object): string {
    /**
     * InterpolatedValue: "You have
     * {lessonCount, plural, =1{1 lesson} other{# lessons}} left."
     * ^firstCurlyBracIndex   .   .   .   .   .   .   .   ^lastCurlyBracIndex.
     */
    let firstCurlyBracIndex = interpolatedValue.indexOf('{');
    if (firstCurlyBracIndex === -1) {
      return interpolatedValue;
    }

    let lastCurlyBracIndex = interpolatedValue.lastIndexOf('}');
    if (lastCurlyBracIndex === -1) {
      return interpolatedValue;
    }

    /**
     * InterpolatedValue: "You have
     * {lessonCount, plural, =1{1 lesson} other{# lessons}} left."
     *  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ -> CodeText.
     */
    const codeText = interpolatedValue.substring(
      firstCurlyBracIndex + 1, lastCurlyBracIndex);

    /**
     * CodeText: lessonCount, plural, =1{1 lesson} other{# lessons}.
     * .   .   . ^^^^^^^^^^^ -> pluralizationKey
     */
    const pluralizationKey = codeText.split(
      ', plural,')[0];
    if (pluralizationParams[pluralizationKey] === undefined) {
      return interpolatedValue;
    }
    let pluralizedValue = '';
    if (
      +pluralizationParams[pluralizationKey] === 1 &&
      codeText.indexOf('=1{') > 0) {
      /**
       * CodeText: lessonCount, plural, =1{1 lesson} other{# lessons}.
       * .   .   .   .   .   .   .   .   . ^^^^^^^^ -> pluralizedValue.
       */
      pluralizedValue = codeText.split('=1{')[1];
      pluralizedValue = pluralizedValue.substring(
        0, pluralizedValue.indexOf('}'));
    } else if (
      +pluralizationParams[pluralizationKey] === 1 &&
      codeText.indexOf('one{') > 0) {
      /**
       * CodeText: lessonCount, plural, one{1 lesson} other{# lessons}.
       * .   .   .   .   .   .   .   .   . ^^^^^^^^ -> pluralizedValue.
       */
      pluralizedValue = codeText.split('one{')[1];
      pluralizedValue = pluralizedValue.substring(
        0, pluralizedValue.indexOf('}'));
    } else {
      /**
       * CodeText: lessonCount, plural,
       *   =1{1 lesson} other{# lessons}.
       * .   .   .   .   .   .^^^^^^^^^ -> pluralizedValue.
       */
      pluralizedValue = codeText.split('other{')[1];
      pluralizedValue = pluralizedValue.substring(
        0, pluralizedValue.indexOf('}'));
      /**
       * PluralizedValue: # lessons
       * .   .   .   .   .^ -> replace this # with lessonCount.
       */
      pluralizedValue = pluralizedValue.replace(
        '#', pluralizationParams[pluralizationKey]);
    }

    return (
      interpolatedValue.substring(0, firstCurlyBracIndex) +
        pluralizedValue +
        interpolatedValue.substring(
          lastCurlyBracIndex + 1, interpolatedValue.length));
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

    this.interpolatedValue = this.pluralizeInterpolatedValue(
      this.interpolatedValue, interpolateParams);
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
