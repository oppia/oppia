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
 * @fileoverview Directive scripts for the topic editor page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import 'angular-ui-sortable';
import uiValidate from 'angular-ui-validate';
import 'third-party-imports/dnd-lists.import';
import 'third-party-imports/ui-codemirror.import';
import 'third-party-imports/ui-tree.import';

angular.module('oppia', [
  require('angular-cookies'), 'dndLists', 'headroom', 'ngAnimate',
  'ngMaterial', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.codemirror', 'ui.sortable', 'ui.tree',
  uiValidate
]);

// The module needs to be loaded directly after jquery since it defines the
// main module the elements are attached to.
require('pages/topic-editor-page/topic-editor-page.module.ts');
require('App.ts');
require('base-components/oppia-root.directive.ts');

require(
  'pages/topic-editor-page/navbar/topic-editor-navbar-breadcrumb.directive.ts');
require('pages/topic-editor-page/navbar/topic-editor-navbar.directive.ts');
require('pages/topic-editor-page/topic-editor-page.component.ts');
