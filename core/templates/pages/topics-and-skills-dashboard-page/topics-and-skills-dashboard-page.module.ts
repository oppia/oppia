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
 * @fileoverview Module for the story viewer page.
 */

import {NgModule} from '@angular/core';
import {SharedComponentsModule} from 'components/shared-component.module';
import {RouterModule} from '@angular/router';

import {SelectTopicsComponent} from './topic-selector/select-topics.component';
import {SkillsListComponent} from './skills-list/skills-list.component';
import {DeleteSkillModalComponent} from './modals/delete-skill-modal.component';
import {UnassignSkillFromTopicsModalComponent} from './modals/unassign-skill-from-topics-modal.component';
import {TopicsListComponent} from './topics-list/topics-list.component';
import {DeleteTopicModalComponent} from './modals/delete-topic-modal.component';
import {AssignSkillToTopicModalComponent} from './modals/assign-skill-to-topic-modal.component';
import {MergeSkillModalComponent} from 'components/skill-selector/merge-skill-modal.component';
import {DynamicContentModule} from 'components/interaction-display/dynamic-content.module';
import {TopicsAndSkillsDashboardPageComponent} from './topics-and-skills-dashboard-page.component';
import {FormsModule} from '@angular/forms';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {CreateNewTopicModalComponent} from './modals/create-new-topic-modal.component';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {TopicsAndSkillsDashboardPageRootComponent} from './topics-and-skills-dashboard-page-root.component';
import {TopicsAndSkillsDashboardAuthGuard} from './topics-and-skills-dashboard-auth.guard';
import {TopicCreationService} from 'components/entity-creation-services/topic-creation.service';
import {CreateNewSkillModalService} from 'pages/topic-editor-page/services/create-new-skill-modal.service';

@NgModule({
  imports: [
    SharedComponentsModule,
    DynamicContentModule,
    FormsModule,
    MatProgressSpinnerModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: TopicsAndSkillsDashboardPageRootComponent,
        canActivate: [TopicsAndSkillsDashboardAuthGuard],
      },
    ]),
  ],
  declarations: [
    SkillsListComponent,
    DeleteSkillModalComponent,
    UnassignSkillFromTopicsModalComponent,
    SelectTopicsComponent,
    AssignSkillToTopicModalComponent,
    MergeSkillModalComponent,
    TopicsListComponent,
    DeleteTopicModalComponent,
    SelectTopicsComponent,
    TopicsAndSkillsDashboardPageComponent,
    CreateNewTopicModalComponent,
    DeleteTopicModalComponent,
    TopicsAndSkillsDashboardPageRootComponent,
  ],
  entryComponents: [
    SkillsListComponent,
    DeleteSkillModalComponent,
    UnassignSkillFromTopicsModalComponent,
    SelectTopicsComponent,
    AssignSkillToTopicModalComponent,
    MergeSkillModalComponent,
    TopicsListComponent,
    DeleteTopicModalComponent,
    SelectTopicsComponent,
    TopicsAndSkillsDashboardPageComponent,
    CreateNewTopicModalComponent,
  ],
  providers: [TopicCreationService, CreateNewSkillModalService],
})
export class TopicsAndSkillsDashboardPageModule {}
