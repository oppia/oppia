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
import {Component} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';

import {DeleteCertificateOfferingModalComponent} from 'components/certificate-assessment-offering-helper/delete-certificate-offering-modal.component';

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
})
export class CertificateOfferingDashboardPageComponent {
  certificateOfferings: CertificateOfferingSummary[] = [
    {
      certificateId: 'dummy_id',
      title: 'Certificate Title',
      topicsLabel: '-',
      timeLabel: '-',
      status: 'Draft',
    },
  ];

  createCertificateOfferingRoute =
    '/' +
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CREATE_CERTIFICATE_OFFERING
      .ROUTE;

  constructor(
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private ngbModal: NgbModal
  ) {}

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
      this.alertsService.addSuccessMessage('Certificate deleted successfully.');
    } catch {
      this.alertsService.addWarning('Failed to delete certificate.');
    }
  }
}
