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
import { CanAccessSplashPageGuard } from './guards/can-access-splash-page.guard';


// All paths should be defined in constants.ts file.
// Otherwise pages will have false 404 status code.
const routes: Route[] = [
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ABOUT.ROUTE,
    loadChildren: () => import('pages/about-page/about-page.module')
      .then(m => m.AboutPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CLASSROOM.ROUTE,
    pathMatch: 'full',
    loadChildren: () => import('pages/classroom-page/classroom-page.module')
      .then(m => m.ClassroomPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DELETE_ACCOUNT.ROUTE,
    pathMatch: 'full',
    loadChildren: () => import(
      'pages/delete-account-page/delete-account-page.module')
      .then(m => m.DeleteAccountPageModule)
  },
  {
    path: (
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PENDING_ACCOUNT_DELETION
        .ROUTE),
    loadChildren: () => import(
      'pages/pending-account-deletion-page/' +
      'pending-account-deletion-page.module')
      .then(m => m.PendingAccountDeletionPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PREFERENCES.ROUTE,
    pathMatch: 'full',
    loadChildren: () => import('pages/preferences-page/preferences-page.module')
      .then(m => m.PreferencesPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PROFILE.ROUTE,
    loadChildren: () => import('pages/profile-page/profile-page.module')
      .then(m => m.ProfilePageModule)
  },
  {
    path: (
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.RELEASE_COORDINATOR_PAGE
        .ROUTE),
    loadChildren: () => import(
      'pages/release-coordinator-page/release-coordinator-page.module')
      .then(m => m.ReleaseCoordinatorPageModule)
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.SPLASH.ROUTE,
    pathMatch: 'full',
    canLoad: [CanAccessSplashPageGuard],
    loadChildren: () => import('pages/splash-page/splash-page.module')
      .then(m => m.SplashPageModule)
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
    RouterModule.forRoot(routes),
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
