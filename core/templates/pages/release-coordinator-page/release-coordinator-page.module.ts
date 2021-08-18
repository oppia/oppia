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
 * @fileoverview Module for the release-coordinator page.
 */

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';

import { SharedComponentsModule } from 'components/shared-component.module';
import { BeamJobsTabComponent } from 'pages/release-coordinator-page/beam-jobs-tab/beam-jobs-tab.component';
import { CancelBeamJobDialogComponent } from 'pages/release-coordinator-page/components/cancel-beam-job-dialog.component';
import { StartNewBeamJobDialogComponent } from 'pages/release-coordinator-page/components/start-new-beam-job-dialog.component';
import { ViewBeamJobOutputDialogComponent } from 'pages/release-coordinator-page/components/view-beam-job-output-dialog.component';
import { JobsTabComponent } from 'pages/release-coordinator-page/jobs-tab/jobs-tab.component';
import { ReleaseCoordinatorNavbarComponent } from 'pages/release-coordinator-page/navbar/release-coordinator-navbar.component';
import { ReleaseCoordinatorPageComponent } from 'pages/release-coordinator-page/release-coordinator-page.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReleaseCoordinatorPageRootComponent } from './release-coordinator-page-root.component';
import { HybridRouterModuleProvider } from 'hybrid-router-module-provider';


@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    ClipboardModule,
    FormsModule,
    HttpClientModule,
    // TODO(#13443): Remove hybrid router module provider once all pages are
    // migrated to angular router.
    HybridRouterModuleProvider.provide(),
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SharedComponentsModule,
  ],
  declarations: [
    BeamJobsTabComponent,
    CancelBeamJobDialogComponent,
    JobsTabComponent,
    ReleaseCoordinatorNavbarComponent,
    ReleaseCoordinatorPageComponent,
    ReleaseCoordinatorPageRootComponent,
    StartNewBeamJobDialogComponent,
    ViewBeamJobOutputDialogComponent,
  ],
  entryComponents: [
    CancelBeamJobDialogComponent,
    JobsTabComponent,
    ReleaseCoordinatorNavbarComponent,
    ReleaseCoordinatorPageComponent,
    ReleaseCoordinatorPageRootComponent,
    StartNewBeamJobDialogComponent,
    ViewBeamJobOutputDialogComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true,
    },
  ],
  bootstrap: [ReleaseCoordinatorPageRootComponent]
})
export class ReleaseCoordinatorPageModule {}
