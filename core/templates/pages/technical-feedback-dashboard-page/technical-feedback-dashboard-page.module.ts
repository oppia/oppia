// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for Technical feedback dashboard.
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedComponentsModule} from 'components/shared-component.module';
import {TechnicalFeedbackDashboardPageComponent} from './technical-feedback-dashboard-page.component';
import {TechnicalFeedbackDashboardPageRootComponent} from './technical-feedback-dashboard-page-root.component';
import {TechnicalFeedbackDashboardPageRoutingModule} from './technical-feedback-dashboard-page-routing.module';

@NgModule({
  imports: [
    SharedComponentsModule,
    CommonModule,
    TechnicalFeedbackDashboardPageRoutingModule,
  ],
  declarations: [
    TechnicalFeedbackDashboardPageRootComponent,
    TechnicalFeedbackDashboardPageComponent,
  ],
  entryComponents: [
    TechnicalFeedbackDashboardPageRootComponent,
    TechnicalFeedbackDashboardPageComponent,
  ],
})
export class TechnicalFeedbackDashboardPageModule {}
