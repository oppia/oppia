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
 * @fileoverview Directive scipts for the exploration editor page and the editor
 *               help tab in the navbar.
 */

// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
require('pages/exploration-editor-page/exploration-editor-page.module.ts');
require('App.ts');

require(
  'pages/exploration-editor-page/editor-navigation/' +
  'editor-navbar-breadcrumb.directive.ts');
require(
  'pages/exploration-editor-page/editor-navigation/' +
  'editor-navigation.directive.ts');
require(
  'pages/exploration-editor-page/exploration-save-and-publish-buttons/' +
  'exploration-save-and-publish-buttons.directive.ts');
require('pages/exploration-editor-page/exploration-editor-page.controller.ts');
