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

import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  OnInit,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Route, RouterModule} from '@angular/router';
import {CookieModule} from 'ngx-cookie';
import {MaintenancePageRootComponent} from 'pages/maintenance-page/maintenance-page-root.component';
import {MaintenancePageModule} from 'pages/maintenance-page/maintenance-page.module';
import {TermsPageRootComponent} from 'pages/terms-page/terms-page-root.component';
import {TermsPageModule} from 'pages/terms-page/terms-page.module';
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
  imports: [
    BrowserModule,
    CookieModule.forRoot(),
    HttpClientModule,
    RouterModule.forRoot(routes),
  ],
  declarations: [LiteRootComponent, ReloadOnUnknownRouteComponent],
  bootstrap: [LiteRootComponent],
})
export class LiteAppModule {}

@Component({
  selector: 'oppia-root',
  template: '<router-outlet></router-outlet>',
})
export class LiteStaticRootComponent {}

/**
 * Bootstraps the target pages without the router so Angular can replace the
 * prerendered markup in a single pass. The full app keeps using LiteAppModule.
 */
@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    CookieModule.forRoot(),
    HttpClientModule,
    MaintenancePageModule,
    RouterModule.forRoot([
      {path: 'terms', component: TermsPageRootComponent},
      {path: 'maintenance', component: MaintenancePageRootComponent},
    ]),
    TermsPageModule,
  ],
  declarations: [LiteStaticRootComponent],
  bootstrap: [LiteStaticRootComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LiteStaticAppModule {}
