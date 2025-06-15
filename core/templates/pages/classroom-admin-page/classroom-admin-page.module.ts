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
 * @fileoverview Module for the classroom-admin page.
 */

import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterModule} from '@angular/router';

import {SharedComponentsModule} from 'components/shared-component.module';
import {ClassroomAdminNavbarComponent} from './navbar/classroom-admin-navbar.component';
import {ClassroomAdminPageComponent} from './classroom-admin-page.component';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {ClassroomEditorConfirmModalComponent} from './modals/classroom-editor-confirm-modal.component';
import {DeleteClassroomConfirmModalComponent} from './modals/delete-classroom-confirm-modal.component';
import {CreateNewClassroomModalComponent} from './modals/create-new-classroom-modal.component';
import {DeleteTopicFromClassroomModalComponent} from './modals/delete-topic-from-classroom-modal.component';
import {TopicsDependencyGraphModalComponent} from './modals/topic-dependency-graph-viz-modal.component';
import {CommonModule} from '@angular/common';
import {ClassroomAdminPageRootComponent} from './classroom-admin-page-root.component';
import {ClassroomAdminAuthGuard} from './classroom-admin-auth.guard';
import {UpdateClassroomsOrderModalComponent} from './modals/update-classrooms-order-modal.component';

@NgModule({
  imports: [
    FormsModule,
    MatCardModule,
    CommonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ClassroomAdminPageRootComponent,
        canActivate: [ClassroomAdminAuthGuard],
      },
    ]),
  ],
  declarations: [
    ClassroomAdminNavbarComponent,
    ClassroomAdminPageComponent,
    ClassroomAdminPageRootComponent,
    ClassroomEditorConfirmModalComponent,
    DeleteClassroomConfirmModalComponent,
    CreateNewClassroomModalComponent,
    DeleteTopicFromClassroomModalComponent,
    TopicsDependencyGraphModalComponent,
    UpdateClassroomsOrderModalComponent,
  ],
  entryComponents: [
    ClassroomAdminNavbarComponent,
    ClassroomAdminPageComponent,
    ClassroomEditorConfirmModalComponent,
    DeleteClassroomConfirmModalComponent,
    CreateNewClassroomModalComponent,
    DeleteTopicFromClassroomModalComponent,
    TopicsDependencyGraphModalComponent,
    UpdateClassroomsOrderModalComponent,
  ],
})
export class ClassroomAdminPageModule {}
