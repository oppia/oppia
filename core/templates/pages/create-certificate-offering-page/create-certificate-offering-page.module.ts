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
 * @fileoverview Module for the create certificate offering page.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedComponentsModule} from 'components/shared-component.module';
import {CertificateOfferingSharedModule} from 'components/certificate-assessment-offering-helper/certificate-offering-shared.module';
import {CreateCertificateOfferingPageComponent} from './create-certificate-offering-page.component';
import {CreateCertificateOfferingPageRootComponent} from './create-certificate-offering-page-root.component';
import {CreateCertificateOfferingPageRoutingModule} from './create-certificate-offering-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    CertificateOfferingSharedModule,
    CreateCertificateOfferingPageRoutingModule,
  ],
  declarations: [
    CreateCertificateOfferingPageRootComponent,
    CreateCertificateOfferingPageComponent,
  ],
  entryComponents: [
    CreateCertificateOfferingPageRootComponent,
    CreateCertificateOfferingPageComponent,
  ],
})
export class CreateCertificateOfferingPageModule {}
