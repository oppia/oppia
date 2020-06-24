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
 * @fileoverview Directive scripts for the subtopic viewer.
 */

// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
require('pages/subtopic-viewer-page/subtopic-viewer-page.module.ts');
require('App.ts');
require('base-components/oppia-root.directive.ts');

require(
  'pages/subtopic-viewer-page/navbar-breadcrumb/' +
  'subtopic-viewer-navbar-breadcrumb.directive.ts');
require(
  'pages/subtopic-viewer-page/navbar-pre-logo-action/' +
  'subtopic-viewer-navbar-pre-logo-action.component.ts');

require('pages/subtopic-viewer-page/subtopic-viewer-page.component.ts');
