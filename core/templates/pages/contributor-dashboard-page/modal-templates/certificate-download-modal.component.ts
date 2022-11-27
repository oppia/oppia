// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the certificate download modal.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';

@Component({
  selector: 'certificate-download-modal',
  templateUrl: './certificate-download-modal.component.html'
})
export class CertificateDownloadModalComponent {
  @Input() suggestionType!: string;
  @Input() username!: string;
  @Input() languageCode: string | null;
  fromDate!: string;
  toDate!: string;
  errorMessage!: string;
  errorsFound = false;
  certificateDownloading = false;
  datesSelected = false;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private contributionAndReviewService: ContributionAndReviewService) {
  }

  ngOnInit(): void {
  }

  close(): void {
    this.activeModal.close();
  }

  downloadCertificate(): void {
    this.errorsFound = false;
    this.errorMessage = '';
    if (
      new Date(this.fromDate) >= new Date(this.toDate) ||
      !this.fromDate ||
      !this.toDate
    ) {
      this.errorsFound = true;
      this.errorMessage = 'Invalid date range.';
      return;
    }
    if (new Date() < new Date(this.toDate)) {
      this.errorsFound = true;
      this.errorMessage = 'Please select a \'To\' date that is earlier than ' +
        'today\'s date';
      return;
    }
    this.certificateDownloading = true;
    this.contributionAndReviewService.downloadContributorCertificateAsync(
      this.username,
      this.suggestionType,
      this.languageCode,
      this.fromDate,
      this.toDate
    ).then((response: Blob) => {
      const dataType = response.type;
      const downloadLink = document.createElement('a');

      downloadLink.href = window.URL.createObjectURL(
        new Blob([response], {type: dataType}));
      downloadLink.setAttribute('download', 'certificate');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      this.certificateDownloading = false;
    }).catch(() => {
      this.errorsFound = true;
      this.certificateDownloading = false;
      this.errorMessage = (
        'Not able to download contributor certificate');
    });
  }

  disableDownloadButton(): boolean {
    return this.fromDate === undefined || this.toDate === undefined;
  }
}

angular.module('oppia').directive(
  'certificateDownloadModal', downgradeComponent(
    {component: CertificateDownloadModalComponent}));
