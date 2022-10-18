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
 * @fileoverview Module for the view learner group page.
 */

import { NgModule } from '@angular/core';
import { SharedComponentsModule } from 'components/shared-component.module';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { Error404PageModule } from 'pages/error-pages/error-404/error-404-page.module';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { ViewLearnerGroupPageRootComponent } from './view-learner-group-page-root.component';
import { ViewLearnerGroupPageRoutingModule } from './view-learner-group-page-routing.module';
import { ViewLearnerGroupPageComponent } from './view-learner-group-page.component';
import { LearnerGroupOverviewComponent } from '../edit-group/learner-group-overview.component';
import { LearnerGroupViewAssignedSyllabusComponent } from './learner-group-view-assigned-syllabus.component';
import { LearnerGroupLearnerSpecificProgressComponent } from '../edit-group/learner-group-learner-specific-progress.component';
import { LearnerGroupPreferencesModalComponent } from '../templates/learner-group-preferences-modal.component';
import { ExitLearnerGroupModalComponent } from '../templates/exit-learner-group-modal.component';

@NgModule({
  imports: [
    CommonModule,
    NgbPopoverModule,
    SharedComponentsModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    ViewLearnerGroupPageRoutingModule,
    Error404PageModule
  ],
  declarations: [
    ViewLearnerGroupPageComponent,
    ViewLearnerGroupPageRootComponent,
    LearnerGroupOverviewComponent,
    LearnerGroupViewAssignedSyllabusComponent,
    LearnerGroupLearnerSpecificProgressComponent,
    ExitLearnerGroupModalComponent,
    LearnerGroupPreferencesModalComponent
  ],
  entryComponents: [
    ViewLearnerGroupPageComponent,
    ViewLearnerGroupPageRootComponent,
    LearnerGroupOverviewComponent,
    LearnerGroupViewAssignedSyllabusComponent,
    LearnerGroupLearnerSpecificProgressComponent,
    ExitLearnerGroupModalComponent,
    LearnerGroupPreferencesModalComponent
  ]
})
export class ViewLearnerGroupPageModule {}
