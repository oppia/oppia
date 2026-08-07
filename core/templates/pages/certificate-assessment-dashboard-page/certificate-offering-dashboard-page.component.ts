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
 * @fileoverview Component for certificate offering dashboard.
 */
import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';

import {DeleteCertificateOfferingModalComponent} from 'components/certificate-assessment-offering-helper/delete-certificate-offering-modal.component';
import './certificate-offering-dashboard-page.component.css';
interface CertificateOfferingSummary {
  certificateId: string;
  title: string;
  topicsLabel: string;
  timeLabel: string;
  status: string;
}
@Component({
  selector: 'oppia-certificate-offering-dashboard-page',
  templateUrl: './certificate-offering-dashboard-page.component.html',
  styleUrls: ['./certificate-offering-dashboard-page.component.css'],
})
export class CertificateOfferingDashboardPageComponent implements OnInit {
  readonly certificatesPerPage = 5;
  certificateOfferings: CertificateOfferingSummary[] = [];
  isLoading = true;
  currentPage = 1;

  createCertificateOfferingRoute =
    '/' +
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CREATE_CERTIFICATE_OFFERING
      .ROUTE;

  constructor(
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private ngbModal: NgbModal
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCertificateOfferings();
  }

  private async loadCertificateOfferings(): Promise<void> {
    try {
      const certificateOfferings =
        await this.certificateAssessmentOfferingBackendApiService.getCertificateAssessmentOfferingsAsync();
      this.certificateOfferings = certificateOfferings
        .map(certificateOffering => ({
          certificateId: certificateOffering.certificateId,
          title: certificateOffering.title,
          topicsLabel: this.getTopicsLabel(certificateOffering.topicData),
          timeLabel: `${certificateOffering.timeLimitInMinutes} min`,
          status: certificateOffering.asyncStatus,
        }))
        .sort((first, second) => first.title.localeCompare(second.title));
      this.currentPage = 1;
    } catch {
      this.alertsService.addWarning('Failed to load certificate offerings.');
    } finally {
      this.isLoading = false;
    }
  }

  private getTopicsLabel(topicData: {[topicId: string]: number}): string {
    const topicCount = Object.keys(topicData).length;
    return topicCount.toString();
  }

  getHumanReadableStatus(status: string): string {
    if (status.toLowerCase() === 'not_ready') {
      return 'Not Ready';
    }
    return status;
  }

  get totalCertificateOfferings(): number {
    return this.certificateOfferings.length;
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.totalCertificateOfferings / this.certificatesPerPage)
    );
  }

  get paginatedCertificateOfferings(): CertificateOfferingSummary[] {
    const startIndex = (this.currentPage - 1) * this.certificatesPerPage;
    return this.certificateOfferings.slice(
      startIndex,
      startIndex + this.certificatesPerPage
    );
  }

  get firstCertificateNumber(): number {
    if (this.totalCertificateOfferings === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.certificatesPerPage + 1;
  }

  get finalCertificateNumber(): number {
    return Math.min(
      this.currentPage * this.certificatesPerPage,
      this.totalCertificateOfferings
    );
  }

  canGoToPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  canGoToNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  goToPreviousPage(): void {
    if (this.canGoToPreviousPage()) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.canGoToNextPage()) {
      this.currentPage += 1;
    }
  }

  getEditCertificateOfferingRoute(certificateId: string): string {
    return (
      '/' +
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.EDIT_CERTIFICATE_OFFERING.ROUTE.replace(
        ':certificate_offering_id',
        certificateId
      )
    );
  }

  openDeleteCertificateOfferingModal(certificateId: string): void {
    this.ngbModal
      .open(DeleteCertificateOfferingModalComponent, {
        backdrop: 'static',
      })
      .result.then(
        () => {
          void this.deleteCertificateOffering(certificateId);
        },
        () => {}
      );
  }

  async deleteCertificateOffering(certificateId: string): Promise<void> {
    try {
      await this.certificateAssessmentOfferingBackendApiService.deleteCertificateAssessmentOfferingAsync(
        certificateId
      );
      this.certificateOfferings = this.certificateOfferings.filter(
        certificateOffering =>
          certificateOffering.certificateId !== certificateId
      );
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
      this.alertsService.addSuccessMessage('Certificate deleted successfully.');
    } catch {
      this.alertsService.addWarning('Failed to delete certificate.');
    }
  }
}
