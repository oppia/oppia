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
 * @fileoverview Module for the NEW lesson player page.
 */

import { NgModule } from '@angular/core';
import { NgbModalModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { NewLessonPlayerViewerCommonModule } from './lesson-player-viewer-common.module';
import { SharedComponentsModule } from 'components/shared-component.module';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { MatButtonModule } from '@angular/material/button';
import { LearnerLocalNavComponent } from '../layout-directives/learner-local-nav.component';
import { FlagExplorationModalComponent } from '../modals/flag-exploration-modal.component';
import { ExplorationSuccessfullyFlaggedModalComponent } from '../modals/exploration-successfully-flagged-modal.component';
import { LearnerViewInfoComponent } from '../layout-directives/learner-view-info.component';
import { MaterialModule } from 'modules/material.module';
import { RefresherExplorationConfirmationModal } from '../modals/refresher-exploration-confirmation-modal.component';
import { NewLessonPlayerPageComponent } from './lesson-player-page.component';
import { LessonInformationCardModalComponent } from '../templates/lesson-information-card-modal.component';
import { NewLessonPlayerPageRoutingModule } from './lesson-player-page-routing.module';
import { NewLessonPlayerPageRootComponent } from './lesson-player-page-root.component';
import { ProgressReminderModalComponent } from '../templates/progress-reminder-modal.component';
import { HintAndSolutionModalService } from '../services/hint-and-solution-modal.service';
import { FatigueDetectionService } from '../services/fatigue-detection.service';

import 'third-party-imports/guppy.import';
import 'third-party-imports/midi-js.import';
import 'third-party-imports/skulpt.import';
import { ToastrModule } from 'ngx-toastr';
import { toastrConfig } from 'pages/oppia-root/app.module';
import { PlayerHeaderComponent } from './new-lesson-player-components/player-header.component';
import { PlayerSidebarComponent } from './new-lesson-player-components/player-sidebar.component';
import { PlayerFooterComponent } from './new-lesson-player-components/player-footer.component';
import { NewAudioBarComponent } from './new-lesson-player-components/new-audio-bar.component';

@NgModule({
  imports: [
    CommonModule,
    NewLessonPlayerPageRoutingModule,
    InteractionExtensionsModule,
    MatButtonModule,
    NgbModalModule,
    MaterialModule,
    NgbPopoverModule,
    NewLessonPlayerViewerCommonModule,
    SharedComponentsModule,
    ToastrModule,
    ToastrModule.forRoot(toastrConfig),
  ],
  declarations: [
    NewLessonPlayerPageComponent,
    NewLessonPlayerPageRootComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    LessonInformationCardModalComponent,
    ProgressReminderModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
    PlayerHeaderComponent,
    PlayerSidebarComponent,
    PlayerFooterComponent,
    NewAudioBarComponent,
  ],
  entryComponents: [
    NewLessonPlayerPageComponent,
    NewLessonPlayerPageRootComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    LessonInformationCardModalComponent,
    ProgressReminderModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
    PlayerHeaderComponent,
    PlayerSidebarComponent,
    PlayerFooterComponent,
    NewAudioBarComponent,
  ],
  providers: [
    HintAndSolutionModalService,
    FatigueDetectionService,
  ]
})
export class NewLessonPlayerPageModule {}
