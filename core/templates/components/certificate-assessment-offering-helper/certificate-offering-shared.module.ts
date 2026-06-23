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
 * @fileoverview Shared module for certificate offering flow components.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedComponentsModule} from 'components/shared-component.module';

import {CertificateOfferingAddTopicItemsComponent} from './certificate-offering-add-topic-items.component';
import {CertificateOfferingDetailsComponent} from './certificate-offering-details.component';
import {CertificateOfferingProgressComponent} from './certificate-offering-progress.component';
import {CertificateOfferingReviewAndAvailabilityComponent} from './certificate-offering-review-and-availability.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  imports: [CommonModule, FormsModule, SharedComponentsModule],
  declarations: [
    CertificateOfferingDetailsComponent,
    CertificateOfferingProgressComponent,
    CertificateOfferingAddTopicItemsComponent,
    CertificateOfferingReviewAndAvailabilityComponent,
  ],
  exports: [
    CertificateOfferingDetailsComponent,
    CertificateOfferingProgressComponent,
    CertificateOfferingAddTopicItemsComponent,
    CertificateOfferingReviewAndAvailabilityComponent,
  ],
})
export class CertificateOfferingSharedModule {}
