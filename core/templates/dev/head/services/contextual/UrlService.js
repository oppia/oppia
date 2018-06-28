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
 * @fileoverview Service for manipulating the page URL. Also allows
 * functions on $window to be mocked in unit tests.
 */

oppia.factory('UrlService', ['$window', function($window) {
  return {
    // This function is for testing purposes (to mock $window.location)
    getCurrentLocation: function() {
      return $window.location;
    },
    getCurrentQueryString: function() {
      return this.getCurrentLocation().search;
    },
    /* As params[key] is overwritten, if query string has multiple fieldValues
       for same fieldName, use getQueryFieldValuesAsList(fieldName) to get it
       in array form. */
    getUrlParams: function() {
      var params = {};
      var parts = this.getCurrentQueryString().replace(
        /[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      );
      return params;
    },
    isIframed: function() {
      var pathname = this.getPathname();
      var urlParts = pathname.split('/');
      return urlParts[1] === 'embed';
    },
    getPathname: function() {
      return this.getCurrentLocation().pathname;
    },
    // Topic id should be correctly returned from topic editor as well as
    // story editor, since both have topic id in their url.
    getTopicIdFromUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/(story|topic)_editor\/\w{12}\b/g)) {
        return pathname.split('/')[2];
      }
      throw Error('Invalid story id url');
    },
    getStoryIdFromUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/story_editor(\/\w{12}\b){2}/g)) {
        return pathname.split('/')[3];
      }
      throw Error('Invalid story id url');
    },
    getQueryFieldValuesAsList: function(fieldName) {
      var fieldValues = [];
      if (this.getCurrentQueryString().indexOf('?') > -1) {
        // Each queryItem return one field-value pair in the url.
        var queryItems = this.getCurrentQueryString().slice(
          this.getCurrentQueryString().indexOf('?') + 1).split('&');
        for (var i = 0; i < queryItems.length; i++) {
          var currentFieldName = decodeURIComponent(
            queryItems[i].split('=')[0]);
          var currentFieldValue = decodeURIComponent(
            queryItems[i].split('=')[1]);
          if (currentFieldName === fieldName) {
            fieldValues.push(currentFieldValue);
          }
        }
      }
      return fieldValues;
    },
    addField: function(url, fieldName, fieldValue) {
      var encodedFieldValue = encodeURIComponent(fieldValue);
      var encodedFieldName = encodeURIComponent(fieldName);
      return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
        '=' + encodedFieldValue;
    },
    getHash: function() {
      return this.getCurrentLocation().hash;
    }
  };
}]);
