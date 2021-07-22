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
 * @fileoverview Module for the profile page.
 */

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { ProfilePageNavbarComponent } from
  'pages/profile-page/profile-page-navbar.component';
import { ProfilePageComponent } from './profile-page.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { EditProfilePictureModalComponent } from 'pages/preferences-page/modal-templates/edit-profile-picture-modal.component';
import { ProfilePageRootComponent } from './profile-page-root.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    NgbPopoverModule,
    SharedComponentsModule
  ],
  declarations: [
    EditProfilePictureModalComponent,
    OppiaAngularRootComponent,
    ProfilePageNavbarComponent,
    ProfilePageComponent,
    ProfilePageRootComponent
  ],
  entryComponents: [
    EditProfilePictureModalComponent,
    OppiaAngularRootComponent,
    ProfilePageNavbarComponent,
    ProfilePageComponent,
    ProfilePageRootComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true
    }
  ],
  bootstrap: [ProfilePageRootComponent]
})
export class ProfilePageModule {}
