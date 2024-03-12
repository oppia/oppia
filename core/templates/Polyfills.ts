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
 * @fileoverview Polyfills for Oppia.
 */

import 'globalthis/auto';
import 'proxy-polyfill';
import '@webcomponents/custom-elements';

// Add a String.prototype.trim() polyfill for IE8.
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// Add an Object.create() polyfill for IE8.
if (typeof Object.create !== 'function') {
  (function () {
    var F = function () {};
    Object.create = function (o) {
      if (arguments.length > 1) {
        throw new Error('Second argument for Object.create() is not supported');
      }
      if (o === null) {
        throw new Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o !== 'object') {
        throw new TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}

// Add a Number.isInteger() polyfill for IE.
Number.isInteger =
  Number.isInteger ||
  function (value) {
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value
    );
  };

// Add Array.fill() polyfill for IE.
if (!Array.prototype.fill) {
  Object.defineProperty(Array.prototype, 'fill', {
    value: function (value) {
      // Steps 1-2.
      if (this === null) {
        throw new TypeError('this is null or not defined');
      }

      var O = Object(this);

      // Steps 3-5.
      var len = O.length >>> 0;

      // Steps 6-7.
      var start = arguments[1];
      var relativeStart = start >> 0;

      // Step 8.
      var k =
        relativeStart < 0
          ? Math.max(len + relativeStart, 0)
          : Math.min(relativeStart, len);

      // Steps 9-10.
      var end = arguments[2];
      var relativeEnd = end === undefined ? len : end >> 0;

      // Step 11.
      var final =
        relativeEnd < 0
          ? Math.max(len + relativeEnd, 0)
          : Math.min(relativeEnd, len);

      // Step 12.
      while (k < final) {
        O[k] = value;
        k++;
      }

      // Step 13.
      return O;
    },
  });
}

// Add SVGElement.prototype.outerHTML polyfill for IE.
if (!('outerHTML' in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, 'outerHTML', {
    get: function () {
      var $node, $temp;
      $temp = document.createElement('div');
      $node = this.cloneNode(true);
      $temp.appendChild($node);
      return $temp.innerHTML;
    },
    enumerable: false,
    configurable: true,
  });
}

// Older browsers might not implement mediaDevices at all,
// so we set an empty object first.
if (navigator.mediaDevices === undefined) {
  // This throws "Cannot assign to 'mediaDevices' because it
  // is a read-only property.". We need to suppress this error because some
  // browsers may not have this property at all. So, we need to set it to
  // an empty object.
  // @ts-ignore
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices.
// We can't just assign an object with getUserMedia
// as it would overwrite existing properties.
// Here, we will just add the getUserMedia property
// if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = async function (constraints) {
    // First get ahold of the legacy getUserMedia, if present.
    var getUserMedia =
      // This throws "Property 'webkitGetUserMedia' does not exist on
      // type 'Navigator'." This is because this API is deprecated.
      // (https://developer.mozilla.org/en-US/docs/Web/API/Navigator
      // /getUserMedia). We need to suppress this error because some browsers
      // still have this functionality.
      // @ts-ignore
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // If getUserMedia is not implemented, return a rejected promise
    // with an error to keep a consistent interface.
    if (!getUserMedia) {
      return Promise.reject(
        new Error('getUserMedia is not implemented in this browser')
      );
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia
    // with a Promise.
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

// Object.entries() polyfill for Chrome 53 and below.
if (!Object.entries) {
  Object.entries = (obj: Object) => {
    let objectProperties = Object.keys(obj);
    let i = objectProperties.length;
    let objectEntriesArray = new Array(i); // Preallocate the array.

    while (i--) {
      objectEntriesArray[i] = [objectProperties[i], obj[objectProperties[i]]];
      return objectEntriesArray;
    }
  };
}
