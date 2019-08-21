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

angular.module('oppia').factory('UrlService', ['$window', function($window) {
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
    getTopicIdFromUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/topic_editor\/(\w|-){12}/g)) {
        return pathname.split('/')[2];
      }
      throw Error('Invalid topic id url');
    },
    getTopicNameFromLearnerUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/(story|topic|subtopic|practice_session)/g)) {
        return decodeURIComponent(pathname.split('/')[2]);
      }
      throw Error('Invalid URL for topic');
    },
    getSubtopicIdFromUrl: function() {
      var pathname = this.getPathname();
      var argumentsArray = pathname.split('/');
      if (pathname.match(/\/subtopic/g) && argumentsArray.length === 4) {
        return decodeURIComponent(argumentsArray[3]);
      }
      throw Error('Invalid URL for subtopic');
    },
    getStoryIdFromUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/(story_editor|review_test)\/(\w|-){12}/g)) {
        return pathname.split('/')[2];
      }
      throw Error('Invalid story id url');
    },
    getStoryIdFromViewerUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/story\/(\w|-){12}/g)) {
        return pathname.split('/')[2];
      }
      throw Error('Invalid story id url');
    },
    getStoryIdInPlayer: function() {
      var query = this.getCurrentQueryString();
      var queryItems = query.split('&');
      for (var i = 0; i < queryItems.length; i++) {
        var part = queryItems[i];
        if (part.match(/\?story_id=((\w|-){12})/g)) {
          return part.split('=')[1];
        }
      }
      return null;
    },
    getSkillIdFromUrl: function() {
      var pathname = this.getPathname();
      var skillId = pathname.split('/')[2];
      if (skillId.length !== 12) {
        throw Error('Invalid Skill Id');
      }
      return skillId;
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
    },
    getOrigin: function() {
      return this.getCurrentLocation().origin;
    },
    getCollectionIdFromExplorationUrl: function() {
      var urlParams = this.getUrlParams();
      if (urlParams.hasOwnProperty('parent')) {
        return null;
      }
      if (urlParams.hasOwnProperty('collection_id')) {
        return urlParams.collection_id;
      }
      return null;
    },
    getUsernameFromProfileUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/(profile)/g)) {
        return decodeURIComponent(pathname.split('/')[2]);
      }
      throw Error('Invalid profile URL');
    },
    getCollectionIdFromUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/(collection)/g)) {
        return decodeURIComponent(pathname.split('/')[2]);
      }
      throw Error('Invalid collection URL');
    },
    getCollectionIdFromEditorUrl: function() {
      var pathname = this.getPathname();
      if (pathname.match(/\/(collection_editor\/create)/g)) {
        return decodeURIComponent(pathname.split('/')[3]);
      }
      throw Error('Invalid collection editor URL');
    },
    getExplorationVersionFromUrl: function() {
      var urlParams = this.getUrlParams();
      if (urlParams.hasOwnProperty('v')) {
        var version = urlParams.v;
        if (version.includes('#')) {
          // For explorations played in an iframe.
          version = version.substring(0, version.indexOf('#'));
        }
        return Number(version);
      }
      return null;
    }
  };
}]);
