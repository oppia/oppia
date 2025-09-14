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
 * @fileoverview Module for the new lesson player page.
 */

import {NgModule} from '@angular/core';
import {NgbModalModule, NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {SharedComponentsModule} from 'components/shared-component.module';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {MatButtonModule} from '@angular/material/button';
import {MaterialModule} from 'modules/material.module';
import {NewLessonPlayerPageComponent} from './lesson-player-page.component';
import {NewLessonPlayerPageRoutingModule} from './lesson-player-page-routing.module';
import {NewLessonPlayerPageRootComponent} from './lesson-player-page-root.component';
import {HintAndSolutionModalService} from '../services/hint-and-solution-modal.service';
import {FatigueDetectionService} from '../services/fatigue-detection.service';

import 'third-party-imports/guppy.import';
import 'third-party-imports/midi-js.import';
import 'third-party-imports/skulpt.import';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {LessonPlayerSidebarComponent} from './sidebar-components/lesson-player-sidebar.component';
import {NewAudioBarComponent} from './conversation-skin-components/new-audio-bar.component';
import {ConceptCardManagerService} from '../services/concept-card-manager.service';
import {NewFlagExplorationModalComponent} from './sidebar-components/flag-lesson-modal.component';
import {CustomizableThankYouModalComponent} from './sidebar-components/customizable-thank-you-modal.component';
import {LessonFeedbackModalComponent} from './sidebar-components/lesson-feedback-modal.component';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {NewSwitchContentLanguageRefreshRequiredModalComponent} from './conversation-skin-components/conversation-display-components/new-switch-content-language-refresh-required-modal.component';
import {NewProgressReminderModalComponent} from './conversation-skin-components/lesson-player-footer/new-progress-reminder-modal.component';
import {ConversationFlowService} from '../services/conversation-flow.service';

@NgModule({
  imports: [
    CommonModule,
    NewLessonPlayerPageRoutingModule,
    InteractionExtensionsModule,
    MatButtonModule,
    MatBottomSheetModule,
    NgbModalModule,
    MaterialModule,
    NgbPopoverModule,
    SharedComponentsModule,
    ToastrModule,
    MatBottomSheetModule,
    ToastrModule.forRoot(toastrConfig),
  ],
  declarations: [
    NewLessonPlayerPageComponent,
    NewLessonPlayerPageRootComponent,
    LessonPlayerSidebarComponent,
    NewSwitchContentLanguageRefreshRequiredModalComponent,
    NewAudioBarComponent,
    NewFlagExplorationModalComponent,
    CustomizableThankYouModalComponent,
    LessonFeedbackModalComponent,
    NewProgressReminderModalComponent,
  ],
  entryComponents: [
    NewFlagExplorationModalComponent,
    CustomizableThankYouModalComponent,
    NewLessonPlayerPageComponent,
    NewLessonPlayerPageRootComponent,
    LessonPlayerSidebarComponent,
    NewAudioBarComponent,
    LessonFeedbackModalComponent,
    NewSwitchContentLanguageRefreshRequiredModalComponent,
    NewProgressReminderModalComponent,
  ],
  providers: [
    HintAndSolutionModalService,
    FatigueDetectionService,
    ConceptCardManagerService,
    ConversationFlowService,
  ],
})
export class NewLessonPlayerPageModule {}
