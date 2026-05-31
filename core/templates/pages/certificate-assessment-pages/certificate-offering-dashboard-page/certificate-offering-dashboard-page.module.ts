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
 * @fileoverview Module for certificate offering dashboard.
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedComponentsModule} from 'components/shared-component.module';
import {CertificateOfferingDashboardPageComponent} from './certificate-offering-dashboard-page.component';
import {CertificateOfferingDashboardPageRoutingModule} from './certificate-offering-dashboard-page-routing.module';
import {CertificateOfferingDashboardPageRootComponent} from './certificate-offering-dashboard-page-root.component';

@NgModule({
  imports: [
    SharedComponentsModule,
    CommonModule,
    CertificateOfferingDashboardPageRoutingModule,
  ],
  declarations: [
    CertificateOfferingDashboardPageRootComponent,
    CertificateOfferingDashboardPageComponent,
  ],
  entryComponents: [
    CertificateOfferingDashboardPageRootComponent,
    CertificateOfferingDashboardPageComponent,
  ],
})
export class CertificateOfferingDashboardPageModule {}
