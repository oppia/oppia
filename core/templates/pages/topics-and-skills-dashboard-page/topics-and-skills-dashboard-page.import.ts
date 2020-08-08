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

// Jquery needs to be loaded before anything else to make angular js work.
require('third-party-imports/jquery.import');
// The module needs to be loaded directly after jquery since it defines the
// main module the elements are attached to.
require(
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
