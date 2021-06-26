// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for storing all generic functions which have to be
 * used at multiple places in the codebase.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  /**
   * Determines if a variable is defined and not null.
   * @param {Object, Array<Object>, string, string[], undefined, null}value
   * @return {boolean} - true if object is defined, false otherwise.
   */
  isDefined(
      value: Object | Object[] | string | string[] | undefined | null
  ): boolean {
    return typeof value !== 'undefined' && value !== null;
  }

  // The function here is to check whether the argument is empty or not. So, we
  // cannot have any specific type defined for the argument and the argument
  // is given a generic type of Object.
  /**
   * @param {Object} obj - the object to be checked.
   * @return {boolean} - true if object is empty, false otherwise.
   */
  isEmpty(obj: Object): boolean {
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        return false;
      }
    }
    return true;
  }

  // The function here is to check whether the argument is a string. So, we
  // cannot have any specific type defined for the argument and the argument
  // is given a generic type of Object.
  /**
   * @param {Object} input - the object to be checked.
   * @return {boolean} - true if input is string, false otherwise.
   */
  isString(input: Object): boolean {
    return (typeof input === 'string' || input instanceof String);
  }

  // The function here is to check whether the two arguments are equivalent or
  // not empty or not. So, we cannot have any specific type defined for the
  // arguments and the arguments are given a generic type of Object.
  /**
   * @param {Object} a - the first object to be compared.
   * @param {Object} b - the second object to be compared.
   * @return {boolean} - true if a is equivalent to b, false otherwise.
   */
  isEquivalent(a: Object, b: Object): boolean {
    if (a === null || b === null) {
      return a === b;
    }
    if (typeof a !== typeof b) {
      return false;
    }
    if (typeof a !== 'object') {
      return a === b;
    }
    // Create arrays of property names.
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length !== bProps.length) {
      return false;
    }
    // The indexing of an Object with a string implicitly returns
    // 'any' type. This issue is solved according to
    // https://github.com/microsoft/TypeScript/issues/35859.
    // Additionally a cast was added to the Record type in order not
    // to modify the structure of the Object interface.
    for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];
      const getKeyValue = (key: string) =>
        (obj: Record<string, Object>) => obj[key];
      if (!this.isEquivalent(
        getKeyValue(propName)(<Record<string, object>>a),
        getKeyValue(propName)(<Record<string, object>>b))
      ) {
        return false;
      }
    }
    return true;
  }

  // Determines if the provided value is an Error.
  // Loosely based on https://www.npmjs.com/package/iserror
  /**
   * @param {Object} value - the object to be checked.
   * @return {boolean} - true if value is an Error object, false otherwise.
   */
  isError(value: Object): boolean {
    switch (Object.prototype.toString.call(value)) {
      case '[object Error]': return true;
      case '[object Exception]': return true;
      case '[object DOMException]': return true;
      default: return value instanceof Error;
    }
  }

  isOverflowing(element: HTMLElement): boolean {
    if (!element) {
      return false;
    } else {
      return (
        element.offsetWidth < element.scrollWidth ||
        element.offsetHeight < element.scrollHeight);
    }
  }
}

angular.module('oppia').factory(
  'UtilsService',
  downgradeInjectable(UtilsService));
