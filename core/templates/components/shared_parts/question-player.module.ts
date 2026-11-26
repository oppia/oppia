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
 * @fileoverview Auto-generated granular module for one shared component.
 * Each component lives in its own module so pages import only what they use.
 */

import {NgModule} from '@angular/core';
import {QuestionPlayerComponent} from '../question-directives/question-player/question-player.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {AttributionGuideModule} from 'components/shared_parts/attribution-guide.module';
import {ConversationSkinModule} from 'components/shared_parts/conversation-skin.module';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NewConversationSkinModule} from 'components/shared_parts/new-conversation-skin.module';
import {PlayerHeaderModule} from 'components/shared_parts/player-header.module';
import {ProgressBarModule} from 'components/shared_parts/progress-bar.module';
import {QuestionPlayerConceptCardModalModule} from 'components/shared_parts/question-player-concept-card-modal.module';
import {ScoreRingModule} from 'components/shared_parts/score-ring.module';
import {SkillMasteryModalModule} from 'components/shared_parts/skill-mastery-modal.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    AttributionGuideModule,
    ConversationSkinModule,
    MatTooltipModule,
    NewConversationSkinModule,
    PlayerHeaderModule,
    ProgressBarModule,
    QuestionPlayerConceptCardModalModule,
    ScoreRingModule,
    SkillMasteryModalModule,
  ],
  declarations: [QuestionPlayerComponent],
  exports: [QuestionPlayerComponent],
})
export class QuestionPlayerModule {}
