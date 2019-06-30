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
 * @fileoverview Module for the Oppia pages.
 */

import { NgModule } from '@angular/core';

import { AboutPageModule } from 'pages/about-page/about-page.module.ts';
import { AdminPageModule } from 'pages/admin-page/admin-page.module.ts';
import { CreatorDashboardPageModule } from
  'pages/creator-dashboard-page/creator-dashboard-page.module.ts';

@NgModule({
  imports: [
    AboutPageModule,
    AdminPageModule,
    CreatorDashboardPageModule
  ]
})
export class PagesModule {}

require('pages/about-page/about-page.module.ts');
require('pages/admin-page/admin-page.module.ts');
require('pages/creator-dashboard-page/creator-dashboard-page.module.ts');

angular.module('pages', [
  'aboutPageModule',
  'adminPageModule',
  'creatorDashboardPageModule'
]);
