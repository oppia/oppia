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
 * @fileoverview Module for the preferences page.
 */

import {NgModule} from '@angular/core';
import {PreferencesPageComponent} from './preferences-page.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import {PreferredSiteLanguageSelectorComponent} from './form-fields/preferred-language-selector.component';
import {PreferredLanguagesComponent} from './form-fields/preferred-languages.component';
import {SubjectInterestsComponent} from './form-fields/subject-interests.component';
import {PreferencesPageRootComponent} from './preferences-page-root.component';
import {CommonModule} from '@angular/common';
import {PreferencesPageRoutingModule} from './preferences-page-routing.module';
import {Error404PageModule} from 'pages/error-pages/error-404/error-404-page.module';
import {EditProfilePictureModalComponent} from './modal-templates/edit-profile-picture-modal.component';
import {RouterModule} from '@angular/router';

import {BackgroundBannerModule} from 'components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from 'base-components/base.module';
import {FormsModule} from '@angular/forms';
import {ImageReceiverModule} from 'components/forms/custom-forms-directives/image-receiver.module';
import {MaterialModule} from 'modules/material.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  imports: [
    TranslateModule,
    StringUtilityPipesModule,
    NgbModule,
    MaterialModule,
    ImageReceiverModule,
    FormsModule,
    BaseModule,
    BackgroundBannerModule,
    CommonModule,
    NgbPopoverModule,
    RouterModule,
    ReactiveFormsModule,
    PreferencesPageRoutingModule,
    Error404PageModule,
  ],
  declarations: [
    EditProfilePictureModalComponent,
    PreferencesPageComponent,
    PreferencesPageRootComponent,
    PreferredLanguagesComponent,
    PreferredSiteLanguageSelectorComponent,
    SubjectInterestsComponent,
  ],
  entryComponents: [
    EditProfilePictureModalComponent,
    PreferencesPageComponent,
    PreferencesPageRootComponent,
    PreferredLanguagesComponent,
    PreferredSiteLanguageSelectorComponent,
    SubjectInterestsComponent,
  ],
})
export class PreferencesPageModule {}
