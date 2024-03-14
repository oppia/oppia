// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the voicover-admin page.
 */

import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterModule} from '@angular/router';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTableModule} from '@angular/material/table';
import {SharedComponentsModule} from 'components/shared-component.module';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {VoiceoverAdminPageComponent} from './voiceover-admin-page.component';
import {VoiceoverAdminNavbarComponent} from './navbar/voiceover-admin-navbar.component';
import {VoiceoverRemovalConfirmModalComponent} from './modals/language-accent-removal-confirm-modal.component';
import {AddAccentToVoiceoverLanguageModalComponent} from './modals/add-accent-to-voiceover-language-modal.component';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {VoiceoverAdminPageRootComponent} from './voiceover-admin-page-root.component';
import {VoiceoverAdminAuthGuard} from './voiceover-admin-page-auth.guard';

@NgModule({
  imports: [
    FormsModule,
    MatCardModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    MatPaginatorModule,
    MatTableModule,
    ToastrModule.forRoot(toastrConfig),
    SharedFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: VoiceoverAdminPageRootComponent,
        canActivate: [VoiceoverAdminAuthGuard],
      },
    ]),
  ],
  declarations: [
    VoiceoverAdminPageRootComponent,
    VoiceoverAdminPageComponent,
    VoiceoverAdminNavbarComponent,
    VoiceoverRemovalConfirmModalComponent,
    AddAccentToVoiceoverLanguageModalComponent,
  ],
  entryComponents: [
    VoiceoverAdminPageRootComponent,
    VoiceoverAdminPageComponent,
    VoiceoverAdminNavbarComponent,
    VoiceoverRemovalConfirmModalComponent,
    AddAccentToVoiceoverLanguageModalComponent,
  ],
})
export class VoiceoverAdminPageModule {}
