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
 * @fileoverview Root routing module.
 */

import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { AppConstants } from 'app.constants';

// All paths must be defined in constants.ts file.
// Otherwise pages will have false 404 status code.
const routes: Route[] = [
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ABOUT.ROUTE,
    loadChildren: () => import('pages/about-page/about-page.module')
      .then(m => m.AboutPageModule)
  }
];

// Register all routes for topic landing page.
for (let key in AppConstants.AVAILABLE_LANDING_PAGES) {
  for (let i = 0; i < AppConstants.AVAILABLE_LANDING_PAGES[key].length; i++) {
    routes.push({
      path: key + '/' + AppConstants.AVAILABLE_LANDING_PAGES[key][i],
      loadChildren: () => import(
        'pages/landing-pages/topic-landing-page/topic-landing-page.module')
        .then(m => m.TopicLandingPageModule)
    });
  }
}

// '**' wildcard route must be kept at the end,as it can override all other
// routes.
routes.push({
  path: '**',
  loadChildren: () => import(
    'pages/error-pages/error-404/error-404-page.module').then(
    m => m.Error404PageModule)
});

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})
export class AppRoutingModule {}
