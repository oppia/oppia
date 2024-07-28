// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the admin page.
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';

import {SharedComponentsModule} from 'components/shared-component.module';
import {TopicManagerRoleEditorModalComponent} from './roles-tab/topic-manager-role-editor-modal.component';
import {TranslationCoordinatorRoleEditorModalComponent} from './roles-tab/translation-coordinator-role-editor-modal.component';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {AdminPlatformParametersTabComponent} from './platform-parameters-tab/admin-platform-parameters-tab.component';
import {AdminPageRootComponent} from './admin-page-root.component';
import {AdminBlogAdminCommonModule} from './admin-blog-admin-common.module';
import {AdminAuthGuard} from './admin-auth.guard';
import {AdminNavbarComponent} from './navbar/admin-navbar.component';
import {AdminDevModeActivitiesTabComponent} from './activities-tab/admin-dev-mode-activities-tab.component';
import {OppiaAdminProdModeActivitiesTabComponent} from './activities-tab/admin-prod-mode-activities-tab.component';
import {AdminMiscTabComponent} from './misc-tab/admin-misc-tab.component';
import {AdminRolesTabComponent} from './roles-tab/admin-roles-tab.component';
import {AdminPageComponent} from './admin-page.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedComponentsModule,
    SharedFormsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: AdminPageRootComponent,
        canActivate: [AdminAuthGuard],
      },
    ]),
    AdminBlogAdminCommonModule,
  ],
  declarations: [
    OppiaAdminProdModeActivitiesTabComponent,
    AdminMiscTabComponent,
    AdminNavbarComponent,
    AdminPageComponent,
    AdminRolesTabComponent,
    AdminDevModeActivitiesTabComponent,
    TopicManagerRoleEditorModalComponent,
    AdminPlatformParametersTabComponent,
    AdminPageRootComponent,
    TranslationCoordinatorRoleEditorModalComponent,
  ],
  entryComponents: [
    OppiaAdminProdModeActivitiesTabComponent,
    AdminMiscTabComponent,
    AdminNavbarComponent,
    AdminPageComponent,
    AdminRolesTabComponent,
    AdminDevModeActivitiesTabComponent,
    TopicManagerRoleEditorModalComponent,
    TranslationCoordinatorRoleEditorModalComponent,
  ],
})
export class AdminPageModule {}
