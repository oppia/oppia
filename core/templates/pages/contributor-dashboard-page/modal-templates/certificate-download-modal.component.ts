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
import { HttpErrorResponse } from '@angular/common/http';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ContributorCertificateResponse } from '../services/contribution-and-review-backend-api.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';

interface CertificateContentData {
  text: string;
  linePosition: number;
}

@Component({
  selector: 'certificate-download-modal',
  templateUrl: './certificate-download-modal.component.html'
})
export class CertificateDownloadModalComponent {
  @Input() suggestionType!: string;
  @Input() username!: string;
  @Input() languageCode!: string | null;
  fromDate!: string;
  toDate!: string;
  errorMessage!: string;
  errorsFound = false;
  certificateDownloading = false;
  datesSelected = false;

  CERTIFICATE_WIDTH: number = 1500;
  CERTIFICATE_HEIGHT: number = 1300;
  CERTIFICATE_MID_POINT: number = 750;
  CERTIFICATE_INNER_BOX_WIDTH: number = 1300;
  CERTIFICATE_INNER_BOX_HEIGHT: number = 1100;
  CANVAS_ROOT_COORDINATE: number = 0;
  INNER_BOX_COORDINATE: number = 100;
  LOGO_X_COORDINATE: number = 650;
  LOGO_Y_COORDINATE: number = 150;
  LOGO_WIDTH: number = 200;
  LOGO_HEIGHT: number = 80;
  SIGNATURE_BASE_COORDINATE: number = 400;
  DATE_BASE_COORDINATE: number = 1100;
  SIGNATURE_LINE_STARTING_POSITION: number = 300;
  SIGNATURE_LINE_ENDING_POSITION: number = 500;
  DATE_LINE_STARTING_POSITION: number = 1000;
  DATE_LINE_ENDING_POSITION: number = 1200;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private contributionAndReviewService: ContributionAndReviewService) {
  }

  close(): void {
    this.activeModal.close();
  }

  validateDate(): void {
    if (
      !this.fromDate ||
      !this.toDate ||
      new Date(this.fromDate) >= new Date(this.toDate)
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
    this.errorsFound = false;
    this.errorMessage = '';
  }

  downloadCertificate(): void {
    this.errorsFound = false;
    this.errorMessage = '';
    this.certificateDownloading = true;
    this.contributionAndReviewService.downloadContributorCertificateAsync(
      this.username,
      this.suggestionType,
      this.languageCode,
      this.fromDate,
      this.toDate
    ).then((response: ContributorCertificateResponse) => {
      this.createCertificate(response);
      this.certificateDownloading = false;
    }).catch((err: HttpErrorResponse) => {
      this.errorsFound = true;
      this.certificateDownloading = false;
      this.errorMessage = (
        err.error.error);
    });
  }

  disableDownloadButton(): boolean {
    return this.fromDate === undefined || this.toDate === undefined;
  }

  createCertificate(response: ContributorCertificateResponse): void {
    const canvas = document.createElement('canvas');
    const currentDate = new Date();
    // Intl.DateTimeFormatOptions is used to enable language sensitive date
    // formatting.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    // Textual parts are starting when y coordinate is equals to 350.
    let linePosition = 350;
    const image = new Image(this.LOGO_WIDTH, this.LOGO_HEIGHT);
    image.src = AppConstants.CONTRIBUTOR_CERTIFICATE_LOGO;
    canvas.width = this.CERTIFICATE_WIDTH;
    canvas.height = this.CERTIFICATE_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (ctx === null) {
      throw new Error('Canvas context not found.');
    }

    image.onload = () => {
      ctx.fillStyle = '#D0E1F0';
      ctx.fillRect(
        this.CANVAS_ROOT_COORDINATE,
        this.CANVAS_ROOT_COORDINATE,
        this.CERTIFICATE_WIDTH,
        this.CERTIFICATE_HEIGHT
      );

      ctx.fillStyle = '#F7FDFF';
      ctx.fillRect(
        this.INNER_BOX_COORDINATE,
        this.INNER_BOX_COORDINATE,
        this.CERTIFICATE_INNER_BOX_WIDTH,
        this.CERTIFICATE_INNER_BOX_HEIGHT
      );

      ctx.drawImage(
        image,
        this.LOGO_X_COORDINATE,
        this.LOGO_Y_COORDINATE,
        this.LOGO_WIDTH,
        this.LOGO_HEIGHT
      );

      ctx.font = '37px Capriola';
      ctx.fillStyle = '#00645C';
      ctx.textAlign = 'center';
      ctx.fillText(
        'CERTIFICATE OF APPRECIATION',
        this.CERTIFICATE_MID_POINT,
        linePosition
      );

      ctx.font = '30px Capriola';
      ctx.fillStyle = '#8F9899';
      linePosition += 150;
      ctx.fillText(
        'WE GRATEFULLY ACKNOWLEDGE',
        this.CERTIFICATE_MID_POINT,
        linePosition
      );

      ctx.font = '40px Capriola';
      ctx.fillStyle = '#00645C';
      linePosition += 100;
      ctx.fillText(this.username, this.CERTIFICATE_MID_POINT, linePosition);

      ctx.font = '28px Capriola';
      ctx.fillStyle = '#8F9899';
      linePosition += 100;

      if (this.suggestionType === 'translate_content') {
        const certificateContentData: CertificateContentData[] = [
          {
            text: 'for their dedication and time in translating Oppia\'s ' +
            'basic maths lessons to ' + response.language,
            linePosition: linePosition
          },
          {
            text: 'which will help our ' + response.language + '-speaking ' +
            'learners better understand the lessons.',
            linePosition: linePosition += 40
          },
          {
            text: 'This certificate confirms that ' + this.username +
            ' has contributed ' + response.contribution_hours + ' hours ' +
            'worth of',
            linePosition: linePosition += 80
          },
          {
            text: 'translations from ' + response.from_date + ' to ' +
            response.to_date + '.',
            linePosition: linePosition += 40
          }
        ];
        this.fillCertificateContent(
          ctx, certificateContentData
        );
        linePosition += 100;
      } else {
        const certificateContentData: CertificateContentData[] = [
          {
            text: 'for their dedication and time in contributing practice ' +
            'questions to Oppia\'s',
            linePosition: linePosition
          },
          {
            text: 'Math Classroom, which supports our mission of improving',
            linePosition: linePosition += 40
          },
          {
            text: 'access to quality education.',
            linePosition: linePosition += 40
          },
          {
            text: 'This certificate confirms that ' + this.username +
            ' has contributed ' + response.contribution_hours + ' hours',
            linePosition: linePosition += 80
          },
          {
            text: `to Oppia from ${response.from_date} to ${response.to_date}.`,
            linePosition: linePosition += 40
          }
        ];
        this.fillCertificateContent(
          ctx, certificateContentData
        );
        linePosition += 40;
      }

      ctx.font = '24px Brush Script MT';
      ctx.fillStyle = '#000000';
      linePosition += 100;
      ctx.fillText(
        response.team_lead,
        this.SIGNATURE_BASE_COORDINATE,
        linePosition
      );

      ctx.font = '24px Roboto';
      ctx.fillText(
        currentDate.toLocaleDateString('en-us', dateOptions),
        this.DATE_BASE_COORDINATE,
        linePosition
      );

      linePosition += 20;
      ctx.moveTo(this.SIGNATURE_LINE_STARTING_POSITION, linePosition);
      ctx.lineTo(this.SIGNATURE_LINE_ENDING_POSITION, linePosition);
      ctx.moveTo(this.DATE_LINE_STARTING_POSITION, linePosition);
      ctx.lineTo(this.DATE_LINE_ENDING_POSITION, linePosition);
      ctx.stroke();

      linePosition += 40;
      ctx.font = '24px Roboto';
      ctx.fillStyle = '#8F9899';
      ctx.fillText('SIGNATURE', this.SIGNATURE_BASE_COORDINATE, linePosition);
      ctx.fillText('DATE', this.DATE_BASE_COORDINATE, linePosition);

      // Create an HTML link and clicks on it to download.
      const link = document.createElement('a');
      link.download = 'certificate.png';
      link.href = canvas.toDataURL();
      link.click();
    };
  }

  fillCertificateContent(
      ctx: CanvasRenderingContext2D,
      data: CertificateContentData[]
  ): void {
    data.forEach((data: CertificateContentData) => {
      ctx.fillText(
        data.text,
        this.CERTIFICATE_MID_POINT,
        data.linePosition
      );
    });
  }
}

angular.module('oppia').directive(
  'certificateDownloadModal', downgradeComponent(
    {component: CertificateDownloadModalComponent}));
