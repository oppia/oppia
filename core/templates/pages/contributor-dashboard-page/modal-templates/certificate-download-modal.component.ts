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
import { ContributorCertificateResponse } from '../services/contribution-and-review-backend-api.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';

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
    ).then((response: ContributorCertificateResponse) => {
      this.createCertificate(response);
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

  createCertificate(response: ContributorCertificateResponse): void {
    const canvas = document.createElement('canvas');
    const currentDate = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    // Textual parts are starting when y coordinate is equals to 350.
    let linePosition = 350;
    const image = new Image(this.LOGO_WIDTH, this.LOGO_HEIGHT);
    image.src = '/assets/images/contributor_dashboard/oppia-logo.jpg';
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
      // Increase y coordinate by 150.
      linePosition += 150;
      ctx.fillText(
        'WE GRATEFULLY ACKNOWLEDGE',
        this.CERTIFICATE_MID_POINT,
        linePosition
      );

      ctx.font = '40px Capriola';
      ctx.fillStyle = '#00645C';
      // Increase y coordinate by 100.
      linePosition += 100;
      ctx.fillText(this.username, this.CERTIFICATE_MID_POINT, linePosition);

      ctx.font = '28px Capriola';
      ctx.fillStyle = '#8F9899';
      // Increase y coordinate by 100.
      linePosition += 100;

      if (this.suggestionType === 'translate_content') {
        linePosition = this.fillTranslationSubmitterCertificateContent(
          linePosition, ctx, response);
      } else {
        linePosition = this.fillQuestionSubmitterCertificateContent(
          linePosition, ctx, response);
      }

      ctx.font = '36px Brush Script MT';
      ctx.fillStyle = '#000000';
      // Increase y coordinate by 100.
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

      // Increase y coordinate by 20.
      linePosition += 20;
      ctx.moveTo(this.SIGNATURE_LINE_STARTING_POSITION, linePosition);
      ctx.lineTo(this.SIGNATURE_LINE_ENDING_POSITION, linePosition);
      ctx.moveTo(this.DATE_LINE_STARTING_POSITION, linePosition);
      ctx.lineTo(this.DATE_LINE_ENDING_POSITION, linePosition);
      ctx.stroke();

      // Increase y coordinate by 40.
      linePosition += 40;
      ctx.font = '24px Roboto';
      ctx.fillStyle = '#8F9899';
      ctx.fillText('SIGNATURE', this.SIGNATURE_BASE_COORDINATE, linePosition);
      ctx.fillText('DATE', this.DATE_BASE_COORDINATE, linePosition);

      // Create an HTML link and clicks on it to download.
      const link = document.createElement('a');
      link.download = 'certificate.jpeg';
      link.href = canvas.toDataURL();
      link.click();
    };
  }

  fillTranslationSubmitterCertificateContent(
      linePosition: number,
      ctx: CanvasRenderingContext2D,
      response: ContributorCertificateResponse
  ): number {
    ctx.fillText(
      'for their dedication and time in translating Oppia\'s basic maths ' +
      'lessons to ' + response.language,
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(
      'which will help our ' + response.language + '-speaking learners ' +
      'better understand the lessons.',
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 80.
    linePosition += 80;

    ctx.fillText(
      `This certificate confirms that ${this.username} has contributed ` +
      response.contribution_hours + ' hours worth of',
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(
      `translations from ${response.from} to ${response.to}`,
      this.CERTIFICATE_MID_POINT,
      860
    );
    // Increase y coordinate by 40.
    linePosition += 100;

    return linePosition;
  }

  fillQuestionSubmitterCertificateContent(
      linePosition: number,
      ctx: CanvasRenderingContext2D,
      response: ContributorCertificateResponse
  ): number {
    ctx.fillText(
      'has contributed practice questions to Oppia\'s',
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(
      'Math Classroom, which supports our mission of improving',
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(
      'access to quality education.',
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 80.
    linePosition += 80;

    ctx.fillText(
      `We confirm that ${this.username} has contributed`,
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(
      `${response.contribution_hours} hours`,
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(
      `to Oppia from ${response.from}`,
      this.CERTIFICATE_MID_POINT,
      linePosition
    );
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText('to', this.CERTIFICATE_MID_POINT, linePosition);
    // Increase y coordinate by 40.
    linePosition += 40;

    ctx.fillText(response.to, this.CERTIFICATE_MID_POINT, linePosition);

    return linePosition;
  }
}

angular.module('oppia').directive(
  'certificateDownloadModal', downgradeComponent(
    {component: CertificateDownloadModalComponent}));
