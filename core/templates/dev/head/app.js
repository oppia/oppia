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
 * @fileoverview Initialization and basic configuration for the Oppia module.
 *
 * @author sll@google.com (Sean Lip)
 */

var oppia = angular.module(
    'oppia', ['ngSanitize', 'ngResource', 'ui.bootstrap']);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
oppia.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

// Service for HTML serialization and escaping.
oppia.factory('oppiaHtmlEscaper', function() {
  var htmlEscaper = {
    objToEscapedJson: function(obj) {
      return this.unescapedStrToEscapedStr(JSON.stringify(obj));
    },
    escapedJsonToObj: function(json) {
      return JSON.parse(this.escapedStrToUnescapedStr(json));
    },
    unescapedStrToEscapedStr: function(str) {
      return String(str)
                  .replace(/&/g, '&amp;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
    },
    escapedStrToUnescapedStr: function(value) {
      return String(value)
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&');
    }
  };
  return htmlEscaper;
});
