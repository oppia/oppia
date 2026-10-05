// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the CkEditor4 components.
 */

import 'zone.js';

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SubtopicsListComponent} from './subtopics-list/subtopics-list.component';
import {StoriesListComponent} from './deprecations/stories-list/topic-viewer-stories-list.component';
import {TopicStorySectionComponent} from './topic-story-section/topic-story-section.component';
import {TopicLessonCardComponent} from './topic-story-section/topic-lesson-card/topic-lesson-card.component';
import {LanguageSelectorComponent} from './topic-story-section/topic-lesson-card/language-selector.component';
import {ModuleEndTestCardComponent} from './topic-story-section/module-end-test-card.component';
import {ModuleCircleBadgeComponent} from './topic-story-section/module-circle-badge.component';
import {ModuleNavigationComponent} from './topic-story-section/module-navigation.component';
import {MasteryChallengeCardComponent} from './topic-story-section/mastery-challenge-card.component';
import {MasteryChallengeLockedModalComponent} from './topic-story-section/mastery-challenge-locked-modal.component';
import {ModuleSkipConfirmationModalComponent} from './topic-story-section/module-skip-confirmation-modal.component';
import {ModuleMasteredModalComponent} from './topic-story-section/module-mastered-modal.component';
import {TopicHeaderComponent} from './topic-header/topic-header.component';
import {TopicViewerContentComponent} from './topic-viewer-content/topic-viewer-content.component';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MatCardModule} from '@angular/material/card';
import {SharedComponentsModule} from 'components/shared-component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatBottomSheetModule,
    MatCardModule,
    SharedComponentsModule,
  ],
  declarations: [
    StoriesListComponent,
    SubtopicsListComponent,
    TopicStorySectionComponent,
    TopicLessonCardComponent,
    LanguageSelectorComponent,
    ModuleEndTestCardComponent,
    ModuleCircleBadgeComponent,
    ModuleNavigationComponent,
    MasteryChallengeCardComponent,
    MasteryChallengeLockedModalComponent,
    ModuleSkipConfirmationModalComponent,
    ModuleMasteredModalComponent,
    TopicHeaderComponent,
    TopicViewerContentComponent,
  ],
  entryComponents: [
    StoriesListComponent,
    SubtopicsListComponent,
    TopicStorySectionComponent,
    TopicLessonCardComponent,
    ModuleEndTestCardComponent,
    LanguageSelectorComponent,
    ModuleCircleBadgeComponent,
    ModuleNavigationComponent,
    MasteryChallengeCardComponent,
    MasteryChallengeLockedModalComponent,
    ModuleSkipConfirmationModalComponent,
    ModuleMasteredModalComponent,
    TopicHeaderComponent,
    TopicViewerContentComponent,
  ],
  exports: [
    StoriesListComponent,
    SubtopicsListComponent,
    TopicStorySectionComponent,
    TopicLessonCardComponent,
    LanguageSelectorComponent,
    ModuleEndTestCardComponent,
    ModuleCircleBadgeComponent,
    ModuleNavigationComponent,
    MasteryChallengeCardComponent,
    MasteryChallengeLockedModalComponent,
    ModuleSkipConfirmationModalComponent,
    ModuleMasteredModalComponent,
    TopicHeaderComponent,
    TopicViewerContentComponent,
  ],
})
export class TopicPlayerViewerCommonModule {}
