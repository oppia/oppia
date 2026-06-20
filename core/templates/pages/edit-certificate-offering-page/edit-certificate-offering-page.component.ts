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
 * @fileoverview Component for the edit certificate offering page.
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

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
  selector: 'oppia-edit-certificate-offering-page',
  templateUrl: './edit-certificate-offering-page.component.html',
})
export class EditCertificateOfferingPageComponent implements OnInit {
  activeSection!: CertificateOfferingSectionId;
  certificateOfferingId: string = '';
  certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    this.certificateOfferingId =
      this.activatedRoute.snapshot.paramMap.get('certificate_offering_id') ||
      '';
    this.populateCertificateAssessmentOfferingFromId();
  }

  populateCertificateAssessmentOfferingFromId(): void {
    // TODO(#24717-M1.14): Replace this with the certificate offering fetch backend call.
    this.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createEmpty();
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

  async updateCertificateOffering(): Promise<void> {
    const certificateId =
      await this.certificateAssessmentOfferingBackendApiService.updateCertificateAssessmentOfferingAsync(
        this.certificateOfferingId,
        this.certificateAssessmentOffering
      );

    if (certificateId) {
      this.alertsService.addSuccessMessage('Certificate updated.');
      this.router.navigate(['/certificate-offering-dashboard']);
    }
  }

  navigateBackToDashboard(): void {
    this.router.navigate(['/certificate-offering-dashboard']);
  }
}
