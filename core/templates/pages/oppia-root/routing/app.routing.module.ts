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
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ABOUT.ROUTE,
    loadChildren: () => import('pages/about-page/about-page.module')
      .then(m => m.AboutPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CONTACT.ROUTE,
    loadChildren: () => import('pages/contact-page/contact-page.module')
      .then(m => m.ContactPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DONATE.ROUTE,
    loadChildren: () => import('pages/donate-page/donate-page.module')
      .then(m => m.DonatePageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.GET_STARTED.ROUTE,
    loadChildren: () => import('pages/get-started-page/get-started-page.module')
      .then(m => m.GetStartedPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LICENSE.ROUTE,
    loadChildren: () => import('pages/license-page/license.module')
      .then(m => m.LicensePageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGIN.ROUTE,
    loadChildren: () => import('pages/login-page/login-page.module')
      .then(m => m.LoginPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGOUT.ROUTE,
    loadChildren: () => import('pages/logout-page/logout-page.module')
      .then(m => m.LogoutPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PARTNERSHIPS.ROUTE,
    loadChildren: () => import(
      'pages/partnerships-page/partnerships-page.module')
      .then(m => m.PartnershipsPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PLAYBOOK.ROUTE,
    loadChildren: () => import('pages/participation-playbook/playbook.module')
      .then(m => m.PlaybookPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PRIVACY.ROUTE,
    loadChildren: () => import('pages/privacy-page/privacy-page.module')
      .then(m => m.PrivacyPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TEACH.ROUTE,
    loadChildren: () => import('pages/teach-page/teach-page.module')
      .then(m => m.TeachPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TERMS.ROUTE,
    loadChildren: () => import('pages/terms-page/terms-page.module')
      .then(m => m.TermsPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.THANKS.ROUTE,
    loadChildren: () => import('pages/thanks-page/thanks-page.module')
      .then(m => m.ThanksPageModule)
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
