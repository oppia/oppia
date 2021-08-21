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
 * @fileoverview Mock angular object for pages that don't use AngularJS.
 */

/**
 * We are at a stage where we can have some pages in Angular. But we share
 * component in between pages. So we can't remove the code that downgrades
 * components and services. This code is found in most Angular components and
 * services (towards the end of the file). In order to not have to create a
 * separate file for each service and component just for the sake of downgrading
 * , we have created this mock AngularJS object that will be used in the pages
 * that don't use AngularJS.
 */

// TODO(#13080): Remove the mock-ajs.ts file after the migration is complete.

import { VERSION } from '@angular/core';

let mockAngular = {
  $$minErr: () => mockAngular,
  component: () => mockAngular,
  config: () => mockAngular,
  constant: () => mockAngular,
  controller: () => mockAngular,
  directive: () => mockAngular,
  factory: () => mockAngular,
  filter: () => mockAngular,
  info: () => mockAngular,
  module: () => mockAngular,
  provider: () => mockAngular,
  requires: () => [],
  run: () => mockAngular,
  service: () => mockAngular,
  value: () => mockAngular,
  version: VERSION
};

// This throws "Property 'angular' does not exist on type 'Window & typeof
// globalThis'." when the `as unknown as ...` is not used.
(window as unknown as {angular: typeof mockAngular}).angular = mockAngular;
