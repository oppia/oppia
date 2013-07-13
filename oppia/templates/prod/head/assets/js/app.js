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

// TODO(sll): The ['ui', 'ngSanitize'] dependencies are only needed for
// editorExploration.js (possibly just the GuiEditor, in fact). Find a way to
// make them load only for that page.
var oppia = angular.module('oppia', ['ui', 'ngSanitize', 'ngResource']);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
oppia.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});
