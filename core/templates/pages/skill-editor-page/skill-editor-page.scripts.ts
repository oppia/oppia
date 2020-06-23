// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Scripts for the skill editor page.
 */

// These requires are needed before the module is bootstrapped since it
// contains code for modules that are bootstrapped later as additional modules.
require('interactions/codemirrorRequires.ts');

// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
require('pages/skill-editor-page/skill-editor-page.module.ts');
require('App.ts');
require('base-components/oppia-root.directive.ts');

require('pages/skill-editor-page/navbar/skill-editor-navbar.directive.ts');
require(
  'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.directive.ts');
require('pages/skill-editor-page/skill-editor-page.component.ts');
