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

import { NgModule } from '@angular/core';
import { NgbModalModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

import { SharedComponentsModule } from 'components/shared-component.module';
import { SwitchContentLanguageRefreshRequiredModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { MatButtonModule } from '@angular/material/button';
import { LearnerLocalNavComponent } from './layout-directives/learner-local-nav.component';
import { FlagExplorationModalComponent } from './modals/flag-exploration-modal.component';
import { ExplorationSuccessfullyFlaggedModalComponent } from './modals/exploration-successfully-flagged-modal.component';
import { LearnerViewInfoComponent } from './layout-directives/learner-view-info.component';
import { MaterialModule } from 'modules/material.module';
import { RefresherExplorationConfirmationModal } from './modals/refresher-exploration-confirmation-modal.component';
import { ExplorationPlayerPageComponent } from './exploration-player-page.component';
import { LessonInformationCardModalComponent } from './templates/lesson-information-card-modal.component';
import { ExplorationPlayerPageRoutingModule } from './exploration-player-page-routing.module';
import { ExplorationPlayerPageRootComponent } from './exploration-player-page-root.component';
import { ProgressReminderModalComponent } from './templates/progress-reminder-modal.component';
import { HintAndSolutionModalService } from './services/hint-and-solution-modal.service';

import 'third-party-imports/guppy.import';
import 'third-party-imports/midi-js.import';
import 'third-party-imports/skulpt.import';

@NgModule({
  imports: [
    CommonModule,
    ExplorationPlayerPageRoutingModule,
    InteractionExtensionsModule,
    MatButtonModule,
    NgbModalModule,
    MaterialModule,
    NgbPopoverModule,
    SharedComponentsModule,
  ],
  declarations: [
    SwitchContentLanguageRefreshRequiredModalComponent,
    ExplorationPlayerPageComponent,
    ExplorationPlayerPageRootComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    LessonInformationCardModalComponent,
    ProgressReminderModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
  ],
  entryComponents: [
    SwitchContentLanguageRefreshRequiredModalComponent,
    ExplorationPlayerPageComponent,
    ExplorationPlayerPageRootComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    LessonInformationCardModalComponent,
    ProgressReminderModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
  ],
  providers: [
    HintAndSolutionModalService
  ]
})
export class ExplorationPlayerPageModule {}
