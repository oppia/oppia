// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Lightweight Angular bootstrap for the target static pages.
 */

import {Component, NgModule, OnInit} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Route, RouterModule} from '@angular/router';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-root',
  template: '<router-outlet></router-outlet>',
})
export class LiteRootComponent {}

/**
 * Reloads unknown routes with the full application module, so links out of
 * the lightweight pages still work without duplicating the whole router.
 */
@Component({
  selector: 'oppia-reload-on-unknown-route',
  template: '',
})
export class ReloadOnUnknownRouteComponent implements OnInit {
  constructor(private windowRef: WindowRef) {}

  ngOnInit(): void {
    this.windowRef.nativeWindow.location.reload();
  }
}

const routes: Route[] = [
  {
    path: 'terms',
    loadChildren: () =>
      import(
        // eslint-disable-next-line capitalized-comments
        'pages/terms-page/terms-page.module' /* webpackChunkName: "lite-terms" */
      ).then(module => module.TermsPageModule),
  },
  {
    path: 'maintenance',
    loadChildren: () =>
      import(
        // eslint-disable-next-line capitalized-comments
        'pages/maintenance-page/maintenance-page.module' /* webpackChunkName: "lite-maintenance" */
      ).then(module => module.MaintenancePageModule),
  },
  {
    path: '**',
    component: ReloadOnUnknownRouteComponent,
  },
];

/**
 * Bootstraps only the shell and modules needed by /terms and /maintenance.
 * The full AppModule is loaded for every other URL by the entry point.
 */
@NgModule({
  imports: [BrowserModule, RouterModule.forRoot(routes)],
  declarations: [LiteRootComponent, ReloadOnUnknownRouteComponent],
  bootstrap: [LiteRootComponent],
})
export class LiteAppModule {}
