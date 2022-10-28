// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives required in contributor-dashboard-admin page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import uiValidate from 'angular-ui-validate';

angular.module('oppia', [
  require('angular-cookies'), 'ngAnimate',
  'ngMaterial', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'ui.bootstrap', uiValidate
]);

require('Polyfills.ts');

// The module needs to be loaded directly after jquery since it defines the
// main module the elements are attached to.
require(
  'pages/contributor-dashboard-admin-page/' +
  'contributor-dashboard-admin-page.module.ts');
require('App.ts');
require('base-components/oppia-root.directive.ts');

require(
  'pages/contributor-dashboard-admin-page/' +
  'contributor-dashboard-admin-page.component.ts');
