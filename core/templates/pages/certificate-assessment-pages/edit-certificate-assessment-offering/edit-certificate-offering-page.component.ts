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

import {
  CertificateOfferingDetails,
  CertificateOfferingDraft,
  CertificateOfferingSectionId,
  CERTIFICATE_OFFERING_SECTION_IDS,
  createEmptyCertificateOfferingDraft,
} from 'pages/certificate-assessment-pages/certificate-offering-shared/certificate-offering-draft.model';

@Component({
  selector: 'oppia-edit-certificate-offering-page',
  templateUrl: './edit-certificate-offering-page.component.html',
})
export class EditCertificateOfferingPageComponent implements OnInit {
  activeSection!: CertificateOfferingSectionId;
  certificateOfferingId: string = '';
  draft: CertificateOfferingDraft = createEmptyCertificateOfferingDraft();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    this.certificateOfferingId =
      this.activatedRoute.snapshot.paramMap.get('certificate_offering_id') ||
      '';
    this.populateDraftFromCertificateOfferingId();
  }

  populateDraftFromCertificateOfferingId(): void {
    // Stub: replace this with the certificate offering fetch backend call.
    this.draft = {
      ...createEmptyCertificateOfferingDraft(),
      details: {
        title: '',
        description: '',
        classroomId: '',
      },
    };
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

  updateDetails(details: CertificateOfferingDetails): void {
    this.draft = {
      ...this.draft,
      details,
    };
  }

  updateSelectedTopicIds(selectedTopicIds: string[]): void {
    this.draft = {
      ...this.draft,
      selectedTopicIds,
    };
  }

  async updateCertificateOffering(): Promise<void> {
    // Stub: call the certificate offering update backend API here.
  }

  navigateBackToDashboard(): void {
    this.router.navigate(['/certificate-offering-dashboard']);
  }
}
