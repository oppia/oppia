// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the diagnostic test player page.
 */

import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {APP_INITIALIZER, DoBootstrap, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BrowserModule, HAMMER_GESTURE_CONFIG} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {downgradeComponent, downgradeModule} from '@angular/upgrade/static';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SharedComponentsModule } from 'components/shared-component.module';
import { ToastrModule } from 'ngx-toastr';
import { toastrConfig } from 'pages/oppia-root/app.module';
import { DiagnosticTestPlayerComponent } from './diagnostic-test-player.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { SummaryTilesModule } from 'components/summary-tile/summary-tile.module';
import { DiagnosticTestPlayerPageRootComponent } from './diagnostic-test-player-page-root.component';
import { CommonModule } from '@angular/common';
import { Error404PageModule } from 'pages/error-pages/error-404/error-404-page.module';
import { DiagnosticTestPlayerPageRoutingModule } from './diagnostic-test-player-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DiagnosticTestPlayerPageRoutingModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    MatCardModule,
    MatTooltipModule,
    ReactiveFormsModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
    SummaryTilesModule,
    ToastrModule.forRoot(toastrConfig),
    Error404PageModule,
    SharedComponentsModule
  ],
  declarations: [
    DiagnosticTestPlayerComponent,
    DiagnosticTestPlayerPageRootComponent
  ],
  entryComponents: [
    DiagnosticTestPlayerComponent,
    DiagnosticTestPlayerPageRootComponent
  ],
})
export class DiagnosticTestPlayerPageModule {}
