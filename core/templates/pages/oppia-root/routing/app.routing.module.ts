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

// All paths should be defined in constants.ts file.
// Otherwise pages will have false 404 status code.
const routes: Route[] = [
  {
    path: AppConstants.ROUTES_REGISTERED_WITH_FRONTEND.ABOUT,
    loadChildren: () => import('pages/about-page/about-page.module')
      .then(m => m.AboutPageModule)
  },
  {
    path: AppConstants.ROUTES_REGISTERED_WITH_FRONTEND.CONTACT,
    loadChildren: () => import('pages/contact-page/contact-page.module')
      .then(m => m.ContactPageModule)
  },
  {
    path: AppConstants.ROUTES_REGISTERED_WITH_FRONTEND.DONATE,
    loadChildren: () => import('pages/donate-page/donate-page.module')
      .then(m => m.DonatePageModule)
  },
  {
    path: AppConstants.ROUTES_REGISTERED_WITH_FRONTEND.GET_STARTED,
    loadChildren: () => import('pages/get-started-page/get-started-page.module')
      .then(m => m.GetStartedPageModule)
  },
  {
    path: '**',
    loadChildren: () => import(
      'pages/error-pages/error-404/error-404-page.module').then(
      m => m.Error404PageModule)
  }
];

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
