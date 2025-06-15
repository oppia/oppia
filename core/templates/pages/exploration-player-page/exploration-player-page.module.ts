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
 * @fileoverview Module for the exploration player page.
 */

import {NgModule} from '@angular/core';
import {NgbModalModule, NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {ExplorationPlayerViewerCommonModule} from './exploration-player-viewer-common.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {MatButtonModule} from '@angular/material/button';
import {LearnerLocalNavComponent} from './layout-directives/learner-local-nav.component';
import {FlagExplorationModalComponent} from './modals/flag-exploration-modal.component';
import {ExplorationSuccessfullyFlaggedModalComponent} from './modals/exploration-successfully-flagged-modal.component';
import {LearnerViewInfoComponent} from './layout-directives/learner-view-info.component';
import {MaterialModule} from 'modules/material.module';
import {RefresherExplorationConfirmationModal} from './modals/refresher-exploration-confirmation-modal.component';
import {ExplorationPlayerPageComponent} from './exploration-player-page.component';
import {ExplorationPlayerPageRootComponent} from './exploration-player-page-root.component';
import {ProgressReminderModalComponent} from './templates/progress-reminder-modal.component';
import {HintAndSolutionModalService} from './services/hint-and-solution-modal.service';
import {FatigueDetectionService} from './services/fatigue-detection.service';

import 'third-party-imports/guppy.import';
import 'third-party-imports/midi-js.import';
import 'third-party-imports/skulpt.import';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {RouterModule} from '@angular/router';
import {ExplorationPlayerPageAuthGuard} from './exploration-player-page-auth.guard';

@NgModule({
  imports: [
    CommonModule,
    InteractionExtensionsModule,
    MatButtonModule,
    NgbModalModule,
    MaterialModule,
    NgbPopoverModule,
    ExplorationPlayerViewerCommonModule,
    SharedComponentsModule,
    ToastrModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ExplorationPlayerPageRootComponent,
        canActivate: [ExplorationPlayerPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    ExplorationPlayerPageComponent,
    ExplorationPlayerPageRootComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    ProgressReminderModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
  ],
  entryComponents: [
    ExplorationPlayerPageComponent,
    ExplorationPlayerPageRootComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    ProgressReminderModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
  ],
  providers: [HintAndSolutionModalService, FatigueDetectionService],
  exports: [LearnerLocalNavComponent, LearnerViewInfoComponent],
})
export class ExplorationPlayerPageModule {}
