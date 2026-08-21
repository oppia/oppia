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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConstants} from 'app.constants';
import {SubmitCertificateAssessmentAnswerBackendDict} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentAttemptData,
  CertificateAssessmentOfferingData,
} from 'domain/certificate-assessment/certificate-assessment.model';
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
  implements OnInit, OnDestroy
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
  remainingTimeInSeconds = 0;
  isTimeExpired = false;
  isSubmissionInProgress = false;
  private timerId: number | null = null;
  private expiryTimestampMs: number | null = null;
  private hasStartedTimer = false;
  // Tracks the most recent submission so that result navigation can wait
  // until the final answers have actually been persisted.
  private pendingSubmission: Promise<void> = Promise.resolve();

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
      await this.startAssessment();
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
      this.startTimerIfReady();
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
    } catch {}
  }

  private async loadClassroomUrlFragment(): Promise<void> {
    try {
      const classroomDataResponse =
        await this.classroomBackendApiService.getClassroomDataAsync(
          this.certificateOffering.classroomId
        );
      this.classroomUrlFragment =
        classroomDataResponse.classroomDict.urlFragment;
    } catch {}
  }

  showInstructions(): void {
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_INSTRUCTIONS;
  }

  showIntro(): void {
    this.currentStage = CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  }

  async startAssessment(): Promise<void> {
    this.resetTimerState();
    try {
      this.attempt =
        await this.certificateAssessmentOfferingBackendApiService.attemptCertificateAssessmentAsync(
          this.certificateId
        );
      this.currentStage =
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
      this.startTimerIfReady();
    } catch {
      this.alertsService.addWarning(
        this.translateService.instant(
          'I18N_CERTIFICATE_ASSESSMENT_START_WARNING'
        )
      );
    }
  }

  async onAssessmentSubmitted(
    answers: SubmitCertificateAssessmentAnswerBackendDict[]
  ): Promise<void> {
    if (this.attempt === null || this.isSubmissionInProgress) {
      return;
    }
    const submittedBeforeExpiry = !this.isTimeExpired;
    const attemptId = this.attempt.attemptId;
    this.isSubmissionInProgress = true;
    this.pendingSubmission = (async () => {
      try {
        await this.certificateAssessmentOfferingBackendApiService.submitCertificateAssessmentAttemptAsync(
          attemptId,
          answers
        );
        if (submittedBeforeExpiry) {
          await this.navigateToResultPage();
        }
      } catch {
        this.alertsService.addWarning(
          this.translateService.instant(
            'I18N_CERTIFICATE_ASSESSMENT_SUBMIT_WARNING'
          )
        );
      } finally {
        this.isSubmissionInProgress = false;
      }
    })();
    await this.pendingSubmission;
  }

  onRetryAssessment(): void {
    this.resetTimerState();
    this.showAssessmentInterruptCard = false;
    this.currentStage = CertificateAssessmentPlayerPageConstants.STAGE_INTRO;
  }

  onResumeAssessment(): void {
    this.showAssessmentInterruptCard = false;
    this.currentStage =
      CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS;
    this.startTimerIfReady();
  }

  async onViewResults(): Promise<boolean> {
    await this.pendingSubmission;
    return this.navigateToResultPage();
  }

  onAssessmentEnded(): Promise<boolean> {
    return this.navigateToLearnerDashboard();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimerIfReady(): void {
    if (
      this.hasStartedTimer ||
      this.attempt === null ||
      this.certificateOffering.timeLimitInMinutes <= 0 ||
      this.currentStage !==
        CertificateAssessmentPlayerPageConstants.STAGE_QUESTIONS
    ) {
      return;
    }
    this.hasStartedTimer = true;
    const durationInSeconds = this.certificateOffering.timeLimitInMinutes * 60;
    // Derive the remaining time from an absolute deadline rather than
    // decrementing per callback, because browsers throttle intervals in
    // inactive tabs and would otherwise let the assessment run longer than
    // its configured duration.
    this.expiryTimestampMs = Date.now() + durationInSeconds * 1000;
    this.remainingTimeInSeconds = durationInSeconds;
    this.timerId = window.setInterval(() => {
      if (this.expiryTimestampMs !== null) {
        this.remainingTimeInSeconds = Math.max(
          0,
          Math.ceil((this.expiryTimestampMs - Date.now()) / 1000)
        );
      }
      if (this.remainingTimeInSeconds === 0) {
        this.isTimeExpired = true;
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private resetTimerState(): void {
    this.clearTimer();
    this.hasStartedTimer = false;
    this.isTimeExpired = false;
    this.remainingTimeInSeconds = 0;
    this.expiryTimestampMs = null;
  }

  private async navigateToLearnerDashboard(): Promise<boolean> {
    return this.router.navigate([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_DASHBOARD.ROUTE}`,
    ]);
  }

  private async navigateToResultPage(): Promise<boolean> {
    if (this.attempt === null) {
      return false;
    }
    return this.router.navigate([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_RESULT.ROUTE.split('/')[0]}`,
      this.attempt.attemptId,
    ]);
  }
}
