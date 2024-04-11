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

import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SharedComponentsModule} from 'components/shared-component.module';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {DiagnosticTestPlayerComponent} from './diagnostic-test-player.component';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {SummaryTilesModule} from 'components/summary-tile/summary-tile.module';
import {DiagnosticTestPlayerPageRootComponent} from './diagnostic-test-player-page-root.component';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {DiagnosticTestPlayerPageAuthGuard} from './diagnostic-test-player-page-auth.guard';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    MatCardModule,
    MatTooltipModule,
    ReactiveFormsModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
    SummaryTilesModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: DiagnosticTestPlayerPageRootComponent,
        canActivate: [DiagnosticTestPlayerPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    DiagnosticTestPlayerPageRootComponent,
    DiagnosticTestPlayerComponent,
  ],
  entryComponents: [
    DiagnosticTestPlayerPageRootComponent,
    DiagnosticTestPlayerComponent,
  ],
})
export class DiagnosticTestPlayerPageModule {}
