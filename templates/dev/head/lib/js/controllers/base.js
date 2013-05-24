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
var ALPHANUMERIC_REGEXP = {
    'regexp': /^[ A-Za-z0-9\.\,\+\(\)\[\]\;\!\'\"\:_-]+$/,
    'warning': 'Invalid input. Please use a non-empty ' +
        'description consisting of alphanumeric characters, underscores, ' +
        'spaces and/or hyphens.'};

// Global utility methods.
function Base($scope, $timeout, $rootScope, warningsData, activeInputData) {
  $scope.warningsData = warningsData;
  $scope.activeInputData = activeInputData;

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

  // Opens the feedback page in a new window.
  $scope.openFeedbackPage = function() {
    window.open('/feedback/?url=' + encodeURIComponent(window.location.pathname));
  };

  /**
   * Creates a request object that can be sent to the server.
   * @param {object} requestObj The object to be sent to the server. It will
        be JSON-stringified and stored under 'payload'.
   */
  $scope.createRequest = function(requestObj) {
    return $.param({payload: JSON.stringify(requestObj)}, true);
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
   * @param {string} iframeId The id of the iframe to add content to.
   * @param {string} content The code for the iframe.
   */
  $scope.addContentToIframe = function(iframeId, content) {
    var iframe = document.getElementById(iframeId);
    if (!iframe) {
      // TODO(sll): Raise an error here.
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

    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  };

  /**
   * Checks whether an entity name is valid, and displays a warning message
   * if it isn't.
   * @param {string} input The input to be checked.
   * @param {boolean} showWarnings Whether to show warnings in the butterbar.
   * @return {boolean} True if the entity name is valid, false otherwise.
   */
  $scope.isValidEntityName = function(input, showWarnings) {
    if (!input) {
      if (showWarnings) {
        warningsData.addWarning('Please enter a non-empty name.');
      }
      return false;
    }
    // Remove whitespace from the beginning and end of the string, and replace
    // interior whitespace with a single space character.
    input = input.trim();
    input = input.replace(/\s{2,}/g, ' ');
    // Do not allow input to start with '[', since this is part of the prefix
    // used in the auto-suggest boxes to identify chapters, questions, etc.
    if (input[0] == '[') {
      if (showWarnings) {
        warningsData.addWarning('Names should not start with a \'[\'.');
      }
      return false;
    }
    if (!ALPHANUMERIC_REGEXP.regexp.test(input)) {
      if (showWarnings) {
        warningsData.addWarning(ALPHANUMERIC_REGEXP.warning);
      }
      return false;
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

  $scope.saveImage = function(successCallback) {
    $('#newImageForm')[0].reset();
    image = $scope.image;

    if (!image || !image.type.match('image.*')) {
      warningsData.addWarning('This file is not recognized as an image.');
      return;
    }

    warningsData.clear();

    // The content creator has uploaded an image.
    var form = new FormData();
    form.append('image', image);

    $.ajax({
        url: '/imagehandler/',
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        datatype: 'json',
        success: function(data) {
          if (data.image_id) {
            $scope.$apply(successCallback(data));
          }
        },
        error: function(data) {
          warningsData.addWarning(
            JSON.parse(data.responseText).error ||
            'Error communicating with server.'
          );
          $scope.$apply();
        }
    });
  };

  $scope.setActiveImage = function(image) {
    $scope.image = image;
  };

  $scope.setActiveFile = function(file) {
    $scope.file = file;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Base.$inject = ['$scope', '$timeout', '$rootScope', 'warningsData', 'activeInputData'];
