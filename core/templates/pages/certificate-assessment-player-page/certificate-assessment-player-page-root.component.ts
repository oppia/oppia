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
 * @fileoverview Root wrapper for the certificate assessment player page.
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConstants} from 'app.constants';
import {SubmitCertificateAssessmentAnswerBackendDict} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentAttemptData,
  CertificateAssessmentOfferingData,
} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {BaseRootComponent, MetaTagData} from 'pages/base-root.component';
import {AlertsService} from 'services/alerts.service';
import {PageHeadService} from 'services/page-head.service';
import {TranslateService} from '@ngx-translate/core';
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';

type CertificateAssessmentStage =
  (typeof CertificateAssessmentPlayerPageConstants)[keyof typeof CertificateAssessmentPlayerPageConstants];

@Component({
  selector: 'oppia-certificate-assessment-player-page-root',
  templateUrl: './certificate-assessment-player-page-root.component.html',
})
export class CertificateAssessmentPlayerPageRootComponent
  extends BaseRootComponent
  implements OnInit
{
  title: string =
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_PLAYER
      .TITLE;

  // TODO(#26274): Make the root-page meta tag contract readonly across BaseRootComponent
  // and all subclasses, then remove this cast and align AppConstants META values.
  meta: MetaTagData[] = AppConstants.PAGES_REGISTERED_WITH_FRONTEND
    .CERTIFICATE_ASSESSMENT_PLAYER.META as unknown as Readonly<MetaTagData>[];

  readonly certificateAssessmentPlayerPageConstants =
    CertificateAssessmentPlayerPageConstants;

  certificateId = '';
  certificateOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  attempt: CertificateAssessmentAttemptData | null = null;
  classroomUrlFragment = '';
  currentStage: CertificateAssessmentStage =
    CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  // TODO(#24717-M2.20): This flag value is by default set as false so the
  // interrupt card does not render. In the future, this flag will change its
  // value based on whether an in-progress attempt is detected on page load.
  showAssessmentInterruptCard = false;
  isLoading = true;
  hasError = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private classroomBackendApiService: ClassroomBackendApiService,
    protected pageHeadService: PageHeadService,
    private router: Router,
    protected translateService: TranslateService
  ) {
    super(pageHeadService, translateService);
  }

  async ngOnInit(): Promise<void> {
    this.certificateId =
      this.activatedRoute.snapshot.paramMap.get('certificate_id') || '';
    const currentRoute = this.activatedRoute.snapshot.url[0]?.path || '';
    if (currentRoute === 'session') {
      this.currentStage =
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    }
    await this.loadCertificateOffering();
  }

  private async loadCertificateOffering(): Promise<void> {
    try {
      this.certificateOffering =
        await this.certificateAssessmentOfferingBackendApiService.getCertificateAssessmentOfferingAsync(
          this.certificateId
        );
      await this.loadClassroomUrlFragment();
    } catch {
      this.hasError = true;
      await this.redirectToNotFound();
    } finally {
      this.isLoading = false;
    }
  }

  private async redirectToNotFound(): Promise<void> {
    try {
      await this.router.navigate([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
      ]);
    } catch {
      // Navigation to the error page is best-effort. The in-page error state
      // (hasError) remains as a fallback if the redirect fails.
    }
  }

  /**
   * Resolves the classroom URL fragment used by the banner exit buttons on the
   * instruction and question pages. The resolution is best-effort: if the
   * classroom data cannot be loaded, the fragment stays empty and the exit
   * button is left without a usable route.
   */
  private async loadClassroomUrlFragment(): Promise<void> {
    try {
      const classroomDataResponse =
        await this.classroomBackendApiService.getClassroomDataAsync(
          this.certificateOffering.classroomId
        );
      this.classroomUrlFragment =
        classroomDataResponse.classroomDict.urlFragment;
    } catch {
      // Classroom data is only used for the banner exit route, so a failure to
      // load it should not block the assessment flow.
    }
  }

  showInstructions(): void {
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_INSTRUCTIONS;
  }

  showIntro(): void {
    this.currentStage = CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  }

  async startAssessment(): Promise<void> {
    try {
      this.attempt =
        await this.certificateAssessmentOfferingBackendApiService.startCertificateAssessmentAttemptAsync(
          this.certificateId
        );
      this.currentStage =
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    } catch {
      this.alertsService.addWarning(
        'Failed to start the certificate assessment.'
      );
    }
  }

  async onAssessmentSubmitted(
    answers: SubmitCertificateAssessmentAnswerBackendDict[]
  ): Promise<void> {
    if (this.attempt === null) {
      return;
    }
    try {
      await this.certificateAssessmentOfferingBackendApiService.submitCertificateAssessmentAttemptAsync(
        this.attempt.attemptId,
        answers
      );
      await this.router.navigate([
        '/certificate-assessment-result',
        this.attempt.attemptId,
      ]);
    } catch {
      this.alertsService.addWarning(
        'Failed to submit the certificate assessment.'
      );
    }
  }

  onRetryAssessment(): void {
    this.showAssessmentInterruptCard = false;
    this.currentStage = CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  }

  onResumeAssessment(): void {
    this.showAssessmentInterruptCard = false;
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
  }
}
