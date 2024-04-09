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
 * @fileoverview Module for the edit learner group page.
 */

import {NgModule} from '@angular/core';
import {SharedComponentsModule} from 'components/shared-component.module';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

import {EditLearnerGroupPageAuthGuard} from './edit-learner-group-page-auth.guard';
import {EditLearnerGroupPageRootComponent} from './edit-learner-group-page-root.component';
import {EditLearnerGroupPageComponent} from './edit-learner-group-page.component';
import {LearnerGroupSyllabusComponent} from './learner-group-syllabus.component';

import {RemoveItemModalComponent} from '../templates/remove-item-modal.component';
import {SyllabusAdditionSuccessModalComponent} from '../templates/syllabus-addition-success-modal.component';
import {LearnerGroupPreferencesComponent} from './learner-group-preferences.component';

import {InviteLearnersModalComponent} from '../templates/invite-learners-modal.component';

import {LearnerGroupLearnersProgressComponent} from './learner-group-learners-progress.component';
import {InviteSuccessfulModalComponent} from '../templates/invite-successful-modal.component';
import {DeleteLearnerGroupModalComponent} from '../templates/delete-learner-group-modal.component';
import {SharedLearnerGroupComponentsModule} from 'pages/learner-group-pages/shared-learner-group-component.module';

@NgModule({
  imports: [
    SharedComponentsModule,
    CommonModule,
    SharedLearnerGroupComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: EditLearnerGroupPageRootComponent,
        canActivate: [EditLearnerGroupPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    EditLearnerGroupPageRootComponent,
    EditLearnerGroupPageComponent,
    LearnerGroupSyllabusComponent,
    LearnerGroupLearnersProgressComponent,
    LearnerGroupPreferencesComponent,
    RemoveItemModalComponent,
    SyllabusAdditionSuccessModalComponent,
    InviteLearnersModalComponent,
    InviteSuccessfulModalComponent,
    DeleteLearnerGroupModalComponent,
  ],
  entryComponents: [
    EditLearnerGroupPageComponent,
    LearnerGroupSyllabusComponent,
    LearnerGroupLearnersProgressComponent,
    LearnerGroupPreferencesComponent,
    RemoveItemModalComponent,
    SyllabusAdditionSuccessModalComponent,
    InviteLearnersModalComponent,
    InviteSuccessfulModalComponent,
    DeleteLearnerGroupModalComponent,
  ],
})
export class EditLearnerGroupPageModule {}
