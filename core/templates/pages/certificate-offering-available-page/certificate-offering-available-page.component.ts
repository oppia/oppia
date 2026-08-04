// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Certificate offering available page component.
 */

import {Component, Input, OnInit} from '@angular/core';

import {AvailableCertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import './certificate-offering-available-page.component.css';

export type CertificateAssessmentStatus = 'passed' | 'failed' | 'not_attempted';

interface AvailableCertificateViewModel {
  id: string;
  title: string;
  status: CertificateAssessmentStatus;
  assessmentRoute: string[];
  passedOnDate?: string;
  failedOnDate?: string;
}

@Component({
  selector: 'oppia-available-certificate-offering-page',
  templateUrl: './certificate-offering-available-page.component.html',
  styleUrls: ['./certificate-offering-available-page.component.css'],
})
export class AvailableCertificateOfferingPageComponent implements OnInit {
  @Input() classroomUrlFragment: string = '';
  availableCertificateOfferings: AvailableCertificateAssessmentOfferingData[] =
    [];
  isLoading = true;
  hasError = false;

  constructor(
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAvailableCertificateOfferings();
  }

  private async loadAvailableCertificateOfferings(): Promise<void> {
    try {
      this.availableCertificateOfferings =
        await this.certificateAssessmentOfferingBackendApiService.getAvailableCertificateOfferingsForClassroomAsync(
          this.classroomUrlFragment
        );
      this.availableCertificateOfferings.sort((first, second) =>
        first.title.localeCompare(second.title)
      );
    } catch {
      this.hasError = true;
      this.alertsService.addWarning(
        'Failed to load certificate assessment offerings.'
      );
    } finally {
      this.isLoading = false;
    }
  }

  private mapAttemptStatus(attemptStatus: string): CertificateAssessmentStatus {
    switch (attemptStatus) {
      case 'Passed':
        return 'passed';
      case 'Failed':
        return 'failed';
      default:
        return 'not_attempted';
    }
  }

  get availableCertificates(): AvailableCertificateViewModel[] {
    return this.availableCertificateOfferings.map(offering => ({
      id: offering.certificateId,
      title: offering.title,
      status: this.mapAttemptStatus(offering.attemptStatus),
      assessmentRoute: this.getCertificateAssessmentRoute(
        offering.certificateId
      ),
      passedOnDate: (offering as {passedOnDate?: string}).passedOnDate,
      failedOnDate: (offering as {failedOnDate?: string}).failedOnDate,
    }));
  }

  getCertificateAssessmentRoute(certificateId: string): string[] {
    return ['/certificate-assessment', certificateId];
  }
}
