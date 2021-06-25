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
import { APP_INITIALIZER, DoBootstrap, NgModule } from '@angular/core';
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
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeComponent, downgradeModule } from '@angular/upgrade/static';

import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
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


declare var angular: ng.IAngularStatic;

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    ClipboardModule,
    FormsModule,
    HttpClientModule,
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
    OppiaAngularRootComponent,
    ReleaseCoordinatorNavbarComponent,
    ReleaseCoordinatorPageComponent,
    StartNewBeamJobDialogComponent,
    ViewBeamJobOutputDialogComponent,
  ],
  entryComponents: [
    CancelBeamJobDialogComponent,
    JobsTabComponent,
    OppiaAngularRootComponent,
    ReleaseCoordinatorNavbarComponent,
    ReleaseCoordinatorPageComponent,
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
})
class ReleaseCoordinatorPageModule implements DoBootstrap {
  ngDoBootstrap() {}
}

angular.module('oppia').requires.push(downgradeModule(extraProviders => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ReleaseCoordinatorPageModule);
}));

angular.module('oppia').directive('oppiaAngularRoot', downgradeComponent({
  component: OppiaAngularRootComponent,
}));
