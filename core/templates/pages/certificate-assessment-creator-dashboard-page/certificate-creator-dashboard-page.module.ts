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
 * @fileoverview Module for certificate Creator dashboard.
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedComponentsModule} from 'components/shared-component.module';
import {CertificateCreatorDashboardPageComponent} from './certificate-creator-dashboard-page.component';
import {CertificateCreatorDashboardPageRoutingModule} from './certificate-creator-dashboard-page-routing.module';
import {CertificateCreatorDashboardPageRootComponent} from './certificate-creator-dashboard-page-root.component';
import {DeleteCertificateOfferingModalComponent} from 'components/certificate-assessment-offering-helper/delete-certificate-offering-modal.component';

@NgModule({
  imports: [
    SharedComponentsModule,
    CommonModule,
    CertificateCreatorDashboardPageRoutingModule,
  ],
  declarations: [
    CertificateCreatorDashboardPageRootComponent,
    CertificateCreatorDashboardPageComponent,
    DeleteCertificateOfferingModalComponent,
  ],
  entryComponents: [
    CertificateCreatorDashboardPageRootComponent,
    CertificateCreatorDashboardPageComponent,
    DeleteCertificateOfferingModalComponent,
  ],
})
export class CertificateCreatorDashboardPageModule {}
