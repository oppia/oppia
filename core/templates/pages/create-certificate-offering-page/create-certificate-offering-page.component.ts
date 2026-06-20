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
 * @fileoverview Component for the create certificate offering page.
 */

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentOfferingData,
  CertificateAssessmentOfferingTopicData,
} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {
  CertificateOfferingSectionId,
  CERTIFICATE_OFFERING_SECTION_IDS,
} from 'components/certificate-assessment-offering-helper/certificate-offering-section.model';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'oppia-create-certificate-offering-page',
  templateUrl: './create-certificate-offering-page.component.html',
})
export class CreateCertificateOfferingPageComponent implements OnInit {
  activeSection!: CertificateOfferingSectionId;
  certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();

  constructor(
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
  }

  isDetailsSection(): boolean {
    return this.activeSection === CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
  }

  isAddTopicsSection(): boolean {
    return (
      this.activeSection === CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS
    );
  }

  isReviewAndAvailabilitySection(): boolean {
    return (
      this.activeSection ===
      CERTIFICATE_OFFERING_SECTION_IDS.REVIEW_AND_AVAILABILITY
    );
  }

  navigateToAddTopicsSection(): void {
    this.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
  }

  navigateToDetailsSection(): void {
    this.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
  }

  navigateToReviewAndAvailabilitySection(): void {
    this.activeSection =
      CERTIFICATE_OFFERING_SECTION_IDS.REVIEW_AND_AVAILABILITY;
  }

  updateCertificateAssessmentOffering(
    certificateAssessmentOffering: CertificateAssessmentOfferingData
  ): void {
    this.certificateAssessmentOffering = certificateAssessmentOffering;
  }

  updateTopicData(topicData: CertificateAssessmentOfferingTopicData): void {
    this.certificateAssessmentOffering.topicData = topicData;
  }

  async saveCertificateOffering(): Promise<void> {
    try {
      const certificateId =
        await this.certificateAssessmentOfferingBackendApiService.createCertificateAssessmentOfferingAsync(
          this.certificateAssessmentOffering
        );

      if (certificateId) {
        this.alertsService.addSuccessMessage('Certificate created.');
        this.router.navigate(['/certificate-offering-dashboard']);
      }
    } catch (error: unknown) {
      this.alertsService.addWarning(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to create certificate.'
      );
    }
  }

  navigateBackToDashboard(): void {
    this.router.navigate(['/certificate-offering-dashboard']);
  }
}
