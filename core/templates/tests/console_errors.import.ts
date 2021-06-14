// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Scripts needed for console_error page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

angular.module('oppia', [
  require('angular-cookies'), 'ngAnimate', 'ngMaterial', 'ngSanitize',
  'ngTouch', 'pascalprecht.translate', 'ui.bootstrap'
]);

require('Polyfills.ts');

// The module needs to be loaded directly after jquery since it defines the
// main module the elements are attached to.
require('tests/console_errors.module.ts');

require('App.ts');

require('base-components/base-content.component.ts');
require('base-components/oppia-root.directive.ts');
