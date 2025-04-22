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

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
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
  isEmpty(obj: Object | undefined | null): boolean {
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
  isString(input: Object | undefined | null): boolean {
    return typeof input === 'string' || input instanceof String;
  }

  // The function here is to check whether the two arguments are equivalent or
  // not empty or not. So, we cannot have any specific type defined for the
  // arguments and the arguments are given a generic type of Object.
  /**
   * @param {Object} a - the first object to be compared.
   * @param {Object} b - the second object to be compared.
   * @return {boolean} - true if a is equivalent to b, false otherwise.
   */
  isEquivalent(a: Object | null, b: Object | null): boolean {
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
      const getKeyValue = (key: string) => (obj: Record<string, Object>) =>
        obj[key];
      if (
        !this.isEquivalent(
          getKeyValue(propName)(a as Record<string, object>),
          getKeyValue(propName)(b as Record<string, object>)
        )
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
  isError(value: Object | undefined | null): boolean {
    switch (Object.prototype.toString.call(value)) {
      case '[object Error]':
        return true;
      case '[object DOMException]':
        return true;
      default:
        return value instanceof Error;
    }
  }

  isOverflowing(element: HTMLElement | null): boolean {
    if (!element) {
      return false;
    } else {
      return (
        element.offsetWidth < element.scrollWidth ||
        element.offsetHeight < element.scrollHeight
      );
    }
  }

  // Determines whether the URL is pointing to a page on the Oppia site.
  getSafeReturnUrl(urlString: string): string {
    try {
      // Make sure the URL can be decoded properly.
      urlString = decodeURIComponent(urlString);
    } catch (_) {
      // The URL could not be decoded, so reject it and return '/' instead.
      return '/';
    }

    try {
      // Throws an exception when the URL does not have a scheme.
      const url = new URL(urlString);

      // Does this URL originate from this website?
      if (url.origin !== new URL(document.URL, document.baseURI).origin) {
        // This is an external URL, so reject it and return '/' instead.
        return '/';
      }
    } catch (_) {
      // Continue to the next validation strategy.
    }

    try {
      // Throws an exception if the URL is truly malformed in some way.
      new URL(urlString, document.baseURI);
    } catch (_) {
      // This is a truly malformed URL, so reject it and return '/' instead.
      return '/';
    }

    if (urlString.charAt(0) !== '/' || urlString.charAt(1) === '/') {
      // The URL is not a relative path, so reject it and return '/' instead.
      return '/';
    } else {
      // The URL is a safe, relative path.
      return urlString;
    }
  }
}
