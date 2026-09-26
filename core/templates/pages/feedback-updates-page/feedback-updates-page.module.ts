// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the feedback-updates page.
 */

import {NgModule} from '@angular/core';
import {SharedComponentsModule} from 'components/shared-component.module';
import {FeedbackUpdatesPageComponent} from './feedback-updates-page.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import {FeedbackUpdatesPageRootComponent} from './feedback-updates-page-root.component';
import {CommonModule} from '@angular/common';
import {FeedbackUpdatesPageRoutingModule} from './feedback-updates-page-routing.module';
import {Error404PageModule} from 'pages/error-pages/error-404/error-404-page.module';
import {RouterModule} from '@angular/router';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {FeedbackSharedModule} from 'components/feedback-shared/feedback-shared.module';

@NgModule({
  imports: [
    CommonModule,
    NgbModalModule,
    NgbPopoverModule,
    RouterModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    FeedbackSharedModule,
    FeedbackUpdatesPageRoutingModule,
    Error404PageModule,
    MatBottomSheetModule,
  ],
  declarations: [
    FeedbackUpdatesPageComponent,
    FeedbackUpdatesPageRootComponent,
  ],
  entryComponents: [
    FeedbackUpdatesPageComponent,
    FeedbackUpdatesPageRootComponent,
  ],
})
export class FeedbackUpdatesPageModule {}
