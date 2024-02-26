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
 * @fileoverview Module for the contributor-dashboard-admin page.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedComponentsModule } from 'components/shared-component.module';
import { CdAdminTranslationRoleEditorModal } from './translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import { CdAdminQuestionRoleEditorModal } from './question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import { UsernameInputModal } from './username-input-modal/username-input-modal.component';
import { ContributorDashboardAdminNavbarComponent } from './navbar/contributor-dashboard-admin-navbar.component';
import { ContributorAdminDashboardPageComponent } from './contributor-admin-dashboard-page.component';
import { ContributorAdminStatsTable } from './contributor-dashboard-tables/contributor-admin-stats-table.component';
import { TopicFilterComponent } from './topic-filter/topic-filter.component';
import { ToastrModule } from 'ngx-toastr';
import { toastrConfig } from 'pages/oppia-root/app.module';
import { ContributorDashboardAdminPageRootComponent } from './contributor-dashboard-admin-page-root.component';
import { ContributorDashboardAdminAuthGuard } from './contributor-dashboard-admin-auth.guard';
import { ContributorDashboardAdminPageComponent } from './contributor-dashboard-admin-page.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatTooltipModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ContributorDashboardAdminPageRootComponent,
        canActivate: [ContributorDashboardAdminAuthGuard],
      },
    ]),
    ReactiveFormsModule,
    SharedComponentsModule,
  ],
  declarations: [
    CdAdminTranslationRoleEditorModal,
    CdAdminQuestionRoleEditorModal,
    ContributorDashboardAdminNavbarComponent,
    ContributorAdminDashboardPageComponent,
    ContributorAdminStatsTable,
    TopicFilterComponent,
    UsernameInputModal,
    ContributorDashboardAdminPageComponent,
    ContributorDashboardAdminPageRootComponent
  ],
  entryComponents: [
    CdAdminTranslationRoleEditorModal,
    CdAdminQuestionRoleEditorModal,
    ContributorDashboardAdminNavbarComponent,
    ContributorAdminDashboardPageComponent,
    ContributorDashboardAdminPageComponent,
    ContributorAdminStatsTable,
    TopicFilterComponent,
    UsernameInputModal
  ],
})

export class ContributorDashboardAdminPageModule {}
