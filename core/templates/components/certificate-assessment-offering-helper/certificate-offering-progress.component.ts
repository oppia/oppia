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
 * @fileoverview Shared progress bar for certificate offering pages.
 */

import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import {
  CertificateOfferingSectionId,
  CERTIFICATE_OFFERING_SECTION_IDS,
  CERTIFICATE_OFFERING_SECTION_NUMBERS,
  CERTIFICATE_OFFERING_PROGRESS_TAB_STATE_LABELS,
  CERTIFICATE_OFFERING_PROGRESS_TAB_STATUSES,
  CERTIFICATE_OFFERING_SECTION_TITLES,
} from './certificate-offering-section.model';
import './certificate-offering-progress.component.css';

@Component({
  selector: 'oppia-certificate-offering-progress',
  templateUrl: './certificate-offering-progress.component.html',
})
export class CertificateOfferingProgressComponent implements OnChanges, OnInit {
  @Input() pageTitle: string = '';
  @Input() activeSection: CertificateOfferingSectionId =
    CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
  progressStatuses: string[] = [];
  progressTabAriaLabels: string[] = [];

  ngOnInit(): void {
    this.updateProgressStatuses();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('activeSection' in changes) {
      this.updateProgressStatuses();
    }
  }

  private updateProgressStatuses(): void {
    this.progressStatuses = [
      this.getProgressTabStatusClass(
        CERTIFICATE_OFFERING_SECTION_NUMBERS.DETAILS
      ),
      this.getProgressTabStatusClass(
        CERTIFICATE_OFFERING_SECTION_NUMBERS.ADD_TOPIC_ITEMS
      ),
      this.getProgressTabStatusClass(
        CERTIFICATE_OFFERING_SECTION_NUMBERS.REVIEW_AND_AVAILABILITY
      ),
    ];
    this.progressTabAriaLabels = this.progressStatuses.map((status, index) => {
      const stateLabel =
        status === CERTIFICATE_OFFERING_PROGRESS_TAB_STATUSES.ACTIVE
          ? CERTIFICATE_OFFERING_PROGRESS_TAB_STATE_LABELS.CURRENT
          : status;
      return `Step ${index + 1}: ${
        CERTIFICATE_OFFERING_SECTION_TITLES[index]
      }, ${stateLabel}`;
    });
  }

  getFurthestReachedSectionNumber(): number {
    if (this.activeSection === CERTIFICATE_OFFERING_SECTION_IDS.DETAILS) {
      return CERTIFICATE_OFFERING_SECTION_NUMBERS.DETAILS;
    }
    if (
      this.activeSection === CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS
    ) {
      return CERTIFICATE_OFFERING_SECTION_NUMBERS.ADD_TOPIC_ITEMS;
    }
    return CERTIFICATE_OFFERING_SECTION_NUMBERS.REVIEW_AND_AVAILABILITY;
  }

  getProgressTabStatusClass(sectionNumber: number): string {
    const furthestReachedSectionNumber = this.getFurthestReachedSectionNumber();
    if (sectionNumber < furthestReachedSectionNumber) {
      return CERTIFICATE_OFFERING_PROGRESS_TAB_STATUSES.COMPLETED;
    }
    if (sectionNumber === furthestReachedSectionNumber) {
      return CERTIFICATE_OFFERING_PROGRESS_TAB_STATUSES.ACTIVE;
    }
    return CERTIFICATE_OFFERING_PROGRESS_TAB_STATUSES.INCOMPLETE;
  }
}
