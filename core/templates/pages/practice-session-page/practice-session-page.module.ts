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
 * @fileoverview Module for the practice session page.
 */

import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {PracticeSessionPageComponent} from './practice-session-page.component';
import {PracticeSessionAccessGuard} from './practice-session-page-auth.guard';
import {PracticeSessionPageRootComponent} from './practice-session-page-root.component';

import {BackgroundBannerModule} from 'components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from 'base-components/base.module';
import {ExplorationFooterModule} from 'components/shared_parts/exploration-footer.module';
import {QuestionPlayerModule} from 'components/shared_parts/question-player.module';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  imports: [
    TranslateModule,
    QuestionPlayerModule,
    ExplorationFooterModule,
    BaseModule,
    BackgroundBannerModule,
    CommonModule,
    InteractionExtensionsModule,
    RouterModule.forChild([
      {
        path: '',
        component: PracticeSessionPageComponent,
        canActivate: [PracticeSessionAccessGuard],
      },
    ]),
    ToastrModule.forRoot(toastrConfig),
  ],
  declarations: [
    PracticeSessionPageRootComponent,
    PracticeSessionPageComponent,
  ],
  entryComponents: [PracticeSessionPageComponent],
})
export class PracticeSessionPageModule {}
