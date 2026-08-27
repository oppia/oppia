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
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentOfferingData,
  CertificateAssessmentOfferingTopicData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {
  CertificateOfferingSectionId,
  CERTIFICATE_OFFERING_SECTION_IDS,
} from 'components/certificate-assessment-offering-helper/certificate-offering-section.model';
import {
  CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS,
  CERTIFICATE_OFFERING_SAVE_STATUSES,
  CERTIFICATE_OFFERING_RESULT_ACTIONS,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import {AlertsService} from 'services/alerts.service';
import {CertificateOfferingConfirmationModalComponent} from 'components/certificate-assessment-offering-helper/certificate-offering-confirmation-modal.component';
import {PostCertificateOfferingResultModalComponent} from 'components/certificate-assessment-offering-helper/post-certificate-offering-result-modal.component';
import './edit-certificate-offering-page.component.css';

@Component({
  selector: 'oppia-edit-certificate-offering-page',
  templateUrl: './edit-certificate-offering-page.component.html',
  styleUrls: ['./edit-certificate-offering-page.component.css'],
})
export class EditCertificateOfferingPageComponent implements OnInit {
  activeSection!: CertificateOfferingSectionId;
  certificateOfferingId: string = '';
  certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  isCertificateValid: boolean = true;
  isLoadingCertificateOffering: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private ngbModal: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    this.certificateOfferingId =
      this.activatedRoute.snapshot.paramMap.get('certificate_offering_id') ||
      '';
    void this.populateCertificateAssessmentOfferingFromId();
  }

  async populateCertificateAssessmentOfferingFromId(): Promise<void> {
    try {
      this.certificateAssessmentOffering =
        await this.certificateAssessmentOfferingBackendApiService.getCertificateAssessmentOfferingAsync(
          this.certificateOfferingId
        );
    } catch {
      this.alertsService.addWarning(
        'The certificate offering could not be loaded.'
      );
      this.router.navigate(['/certificate-creator-dashboard']);
    } finally {
      this.isLoadingCertificateOffering = false;
    }
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
    try {
      const modalRef = this.ngbModal.open(
        CertificateOfferingConfirmationModalComponent,
        {backdrop: 'static'}
      );
      modalRef.componentInstance.action =
        CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE;
      modalRef.componentInstance.currentAsyncStatus =
        this.certificateAssessmentOffering.asyncStatus;
      modalRef.componentInstance.isCertificateValid = this.isCertificateValid;

      const action = await modalRef.result.catch(() => null);
      if (
        action !== CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY &&
        action !== CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS.UPDATE
      ) {
        return;
      }

      const certificateAssessmentOfferingForSave =
        CertificateAssessmentOfferingData.createFromBackendDict({
          certificate_id: this.certificateAssessmentOffering.certificateId,
          title: this.certificateAssessmentOffering.title,
          description: this.certificateAssessmentOffering.description,
          classroom_id: this.certificateAssessmentOffering.classroomId,
          topic_ids: Object.keys(this.certificateAssessmentOffering.topicData),
          topic_data: this.certificateAssessmentOffering.topicData,
          demonstrates: this.certificateAssessmentOffering.demonstrates,
          total_questions: this.certificateAssessmentOffering.totalQuestions,
          time_limit_in_minutes:
            this.certificateAssessmentOffering.timeLimitInMinutes,
          async_status:
            action === CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY
              ? 'Not_Ready'
              : 'Available',
          version: this.certificateAssessmentOffering.version,
        });

      const certificateId =
        await this.certificateAssessmentOfferingBackendApiService.updateCertificateAssessmentOfferingAsync(
          this.certificateOfferingId,
          certificateAssessmentOfferingForSave
        );

      if (!certificateId) {
        return;
      }

      if (action === CERTIFICATE_OFFERING_SAVE_STATUSES.NOT_READY) {
        this.alertsService.addSuccessMessage('Certificate saved as not ready.');
        this.navigateToCertificateOfferingDashboard();
        return;
      }

      this.alertsService.addSuccessMessage('Certificate updated.');
      const postModalRef = this.ngbModal.open(
        PostCertificateOfferingResultModalComponent,
        {
          centered: true,
          windowClass: 'oppia-certificate-result-modal',
        }
      );
      postModalRef.componentInstance.action =
        CERTIFICATE_OFFERING_RESULT_ACTIONS.UPDATED;
      await postModalRef.result.catch(() => null);
      this.navigateToCertificateOfferingDashboard();
    } catch (error: unknown) {
      this.alertsService.addWarning(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to update certificate.'
      );
    }
  }

  navigateBackToDashboard(): void {
    this.navigateToCertificateOfferingDashboard();
  }

  private navigateToCertificateOfferingDashboard(): void {
    this.router.navigate(['/certificate-creator-dashboard']);
  }
}
