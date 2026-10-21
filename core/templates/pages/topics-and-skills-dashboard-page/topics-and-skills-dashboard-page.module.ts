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
import {RteHelperService} from 'services/rte-helper.service';

import {BackgroundBannerModule} from 'components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from 'base-components/base.module';
import {CommonModule} from '@angular/common';
import {CreateNewSkillModalModule} from 'components/shared_parts/create-new-skill-modal.module';
import {RteHelperModalModule} from 'components/shared_parts/rte-helper-modal.module';
import {DirectivesModule} from 'directives/directives.module';
import {FilteredChoicesFieldModule} from 'components/shared_parts/filtered-choices-field.module';
import {ImageUploaderModule} from 'components/shared_parts/image-uploader.module';
import {MaterialModule} from 'modules/material.module';
import {MultiSelectionFieldModule} from 'components/shared_parts/multi-selection-field.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SkillSelectorModule} from 'components/shared_parts/skill-selector.module';
import {TopicsAndSkillsDashboardNavbarBreadcrumbModule} from 'components/shared_parts/topics-and-skills-dashboard-navbar-breadcrumb.module';
import {TranslateModule} from '@ngx-translate/core';
import {UrlFragmentEditorModule} from 'components/shared_parts/url-fragment-editor.module';
@NgModule({
  imports: [
    UrlFragmentEditorModule,
    TranslateModule,
    TopicsAndSkillsDashboardNavbarBreadcrumbModule,
    SkillSelectorModule,
    RteHelperModalModule,
    NgbModule,
    MultiSelectionFieldModule,
    MaterialModule,
    ImageUploaderModule,
    FilteredChoicesFieldModule,
    DirectivesModule,
    CreateNewSkillModalModule,
    CommonModule,
    BaseModule,
    BackgroundBannerModule,
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
  providers: [
    TopicCreationService,
    CreateNewSkillModalService,
    RteHelperService,
  ],
})
export class TopicsAndSkillsDashboardPageModule {}
