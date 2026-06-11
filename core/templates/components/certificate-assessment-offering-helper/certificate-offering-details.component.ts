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
 * @fileoverview Details step for creating or editing a certificate offering.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';

@Component({
  selector: 'oppia-certificate-offering-details',
  templateUrl: './certificate-offering-details.component.html',
})
export class CertificateOfferingDetailsComponent {
  @Input() certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  @Output() certificateAssessmentOfferingChange =
    new EventEmitter<CertificateAssessmentOfferingData>();
  @Output() navigateToAddTopicsSection = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  onNextClicked(): void {
    this.certificateAssessmentOfferingChange.emit(
      this.certificateAssessmentOffering
    );
    this.navigateToAddTopicsSection.emit();
  }

  onCancelClicked(): void {
    this.cancelClicked.emit();
  }
}
