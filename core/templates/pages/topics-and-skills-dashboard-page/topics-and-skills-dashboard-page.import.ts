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
 * @fileoverview Directive scripts for the topics and skills dashboard.
 */

import 'core-js/es7/reflect';
import 'zone.js';
import 'angular';

import 'angular-ui-sortable';
import uiValidate from 'angular-ui-validate';
import 'third-party-imports/guppy.import';
import 'third-party-imports/midi-js.import';
import 'third-party-imports/ng-audio.import';
import 'third-party-imports/ng-joy-ride.import';
import 'third-party-imports/skulpt.import';
import 'third-party-imports/ui-tree.import';

import 'headroom.js/dist/headroom';
import 'headroom.js/dist/angular.headroom';
import 'angular-animate';
import 'messageformat';
import 'angular-translate';
import 'angular-translate-interpolation-messageformat';

require('static/angularjs-1.8.2/angular-aria.js');
require('static/bower-material-1.1.19/angular-material.js');
require('static/angularjs-1.8.2/angular-sanitize.min.js');
require('static/angularjs-1.8.2/angular-touch.min.js');
require('static/angular-toastr-1.7.0/dist/angular-toastr.tpls.min.js');
require('static/ui-bootstrap-2.5.0/ui-bootstrap-tpls-2.5.0.js');
require(
  'static/bower-angular-translate-storage-cookie-2.18.1/' +
  'angular-translate-storage-cookie.min.js');
declare var angular: ng.IAngularStatic;
angular.module('oppia', [
  require('angular-cookies'), 'headroom', 'ngAnimate',
  'ngMaterial', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.sortable', uiValidate
]);

// The module needs to be loaded directly after jquery since it defines the
// main module the elements are attached to.
const { TopicsAndSkillsDashboardPageModule } = require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.module.ts');
require('App.ts');
require('base-components/oppia-root.directive.ts');

require(
  'pages/topics-and-skills-dashboard-page/navbar/' +
  'topics-and-skills-dashboard-navbar-breadcrumb.directive.ts'
);
require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.component.ts');
// Bootstrap the application.
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
platformBrowserDynamic().bootstrapModule(TopicsAndSkillsDashboardPageModule);
