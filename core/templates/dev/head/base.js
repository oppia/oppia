// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Oppia's base controller.
 *
 * @author sll@google.com (Sean Lip)
 */

var editorUrl = '/editor/';
var pathnameArray = window.location.pathname.split('/');

// Global utility methods.
function Base($scope, $http, $rootScope, warningsData, activeInputData) {
  $scope.warningsData = warningsData;
  $scope.activeInputData = activeInputData;

  // If the exploration is iframed, send data to its parent about its height so
  // that the parent can be resized as necessary.
  window.onBodyLoad = function() {
    if (window.parent != window) {
      console.log('Exploration body loaded; posting message to parent.');
      window.parent.postMessage(
        {'explorationHeight': document.body.scrollHeight}, '*'
      );

      $scope.$broadcast('pageLoaded', null);
    }
  };

  /**
   * Returns whether the current URL corresponds to the demo playground server.
   */
  $scope.isDemoServer = function() {
    return location.host == 'oppiaserver.appspot.com';
  };

  // Gets URL parameter values.
  $scope.getUrlParams = function() {
    var params = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
      params[key] = value;
    });
    return params;
  };

  $scope.updateMath = function() {
    console.log('Updating math expressions.');
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  };

  /**
   * Creates a request object that can be sent to the server.
   * @param {object} requestObj The object to be sent to the server. It will
        be JSON-stringified and stored under 'payload'.
   */
  $scope.createRequest = function(requestObj) {
    return $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify(requestObj),
      source: document.URL
    }, true);
  };

  /**
   * Checks if an object is empty.
   */
  $scope.isEmpty = function(obj) {
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Adds content to an iframe.
   * @param {Element} iframe The iframe element to add content to.
   * @param {string} content The code for the iframe.
   */
  $scope.addContentToIframe = function(iframe, content) {
    if (typeof(iframe) == 'string') {
      iframe = document.getElementById(iframe);
    }
    if (!iframe) {
      console.log('No iframe found.');
      return;
    }
    if (iframe.contentDocument) {
      doc = iframe.contentDocument;
    } else {
      doc = iframe.contentWindow ? iframe.contentWindow.document : iframe.document;
    }
    doc.open();
    doc.writeln(content);
    doc.close();
  };

  /**
   * Adds content to an iframe where iframe is specified by its ID.
   * @param {string} iframeId The id of the iframe to add content to.
   * @param {string} content The code for the iframe.
   */
  $scope.addContentToIframeWithId = function(iframeId, content) {
    $scope.addContentToIframe(document.getElementById(iframeId), content);
  };

  $scope.normalizeWhitespace = function(input) {
    if (typeof input == 'string' || input instanceof String) {
      // Remove whitespace from the beginning and end of the string, and
      // replace interior whitespace with a single space character.
      input = input.trim();
      input = input.replace(/\s{2,}/g, ' ');
      return input;
    } else {
      return input;
    }
  };

  /**
   * Checks whether an entity name is valid, and displays a warning message
   * if it isn't.
   * @param {string} input The input to be checked.
   * @param {boolean} showWarnings Whether to show warnings in the butterbar.
   * @return {boolean} True if the entity name is valid, false otherwise.
   */
  $scope.isValidEntityName = function(input, showWarnings) {
    input = $scope.normalizeWhitespace(input);

    if (!input) {
      if (showWarnings) {
        warningsData.addWarning('Please enter a non-empty name.');
      }
      return false;
    }

    for (var i = 0; i < GLOBALS.INVALID_NAME_CHARS.length; i++) {
      if (input.indexOf(GLOBALS.INVALID_NAME_CHARS[i]) !== -1) {
        if (showWarnings) {
          warningsData.addWarning(
           'Invalid input. Please use a non-empty description consisting ' +
           'of alphanumeric characters, underscores, spaces and/or hyphens.'
          );
        }
        return false;
      }
    }
    return true;
  };

  /**
   * Checks if a new user-entered field is a duplicate of one that already
   * exists in a given object.
   * @param {object} object The object to be iterated over.
   * @param {string} field The variable name corresponding to the field that
   *     will store the new input.
   * @param {string} currentKey The value of the key for which a new input is
   *     being given.
   * @param {string} newInput The new input whose existence in the object is
   *     being checked.
   * @return {bool} true if the input is already in the list under a key that is
   *     not currentKey; false otherwise.
   */
  $scope.isDuplicateInput = function(object, field, currentKey, newInput) {
    for (var key in object) {
      if (key != currentKey && object[key][field] == newInput) {
        return true;
      }
    }
    return false;
  };

  /**
   * Checks if a new user-entered field is a duplicate of one that already
   * exists a given array.
   * @param {array} array The array to be iterated over.
   * @param {string} field The variable name corresponding to the field that
   *     will store the new input.
   * @param {string} index The index for which a new input is being given.
   * @param {string} newInput The new input whose existence in the array is
   *     being checked.
   * @return {bool} true if the input is already in the list under a key that is
   *     not index; false otherwise.
   */
  $scope.isDuplicateArrayInput = function(array, field, index, newInput) {
    for (var i = 0; i < array.length; ++i) {
      if (i != index && array[i][field] == newInput) {
        warningsData.addWarning(
            'The name \'' + String(newInput) + '\' is already in use.');
        return true;
      }
    }
    return false;
  };

  $scope.setActiveImage = function(image) {
    $scope.image = image;
  };

  $scope.setActiveFile = function(file) {
    $scope.file = file;
  };

  $scope.cloneObject = function(obj) {
    return angular.copy(obj);
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Base.$inject = ['$scope', '$http', '$rootScope', 'warningsData', 'activeInputData'];
