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
import {CertificateAssessmentPlayerStateService} from './certificate-assessment-player-state.service';

@Component({
  selector: 'oppia-certificate-assessment-player-page-root',
  templateUrl: './certificate-assessment-player-page-root.component.html',
  // The state service is scoped to this component so that its countdown
  // interval is torn down together with the page it belongs to.
  providers: [CertificateAssessmentPlayerStateService],
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
  classroomUrlFragment = '';
  isLoading = true;
  hasError = false;
  isSubmissionInProgress = false;
  // Tracks the most recent submission so that result navigation can wait
  // until the final answers have actually been persisted.
  private pendingSubmission: Promise<void> = Promise.resolve();

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertsService: AlertsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private certificateAssessmentPlayerStateService: CertificateAssessmentPlayerStateService,
    private classroomBackendApiService: ClassroomBackendApiService,
    protected pageHeadService: PageHeadService,
    private router: Router,
    protected translateService: TranslateService
  ) {
    super(pageHeadService, translateService);
  }

  get currentStage(): string {
    return this.certificateAssessmentPlayerStateService.currentStage;
  }

  get attempt(): CertificateAssessmentAttemptData | null {
    return this.certificateAssessmentPlayerStateService.getAttempt();
  }

  get showAssessmentInterruptCard(): boolean {
    return this.certificateAssessmentPlayerStateService
      .showAssessmentInterruptCard;
  }

  get isTimeExpired(): boolean {
    return this.certificateAssessmentPlayerStateService.isTimeExpired;
  }

  get remainingTimeInSeconds(): number {
    return this.certificateAssessmentPlayerStateService.remainingTimeInSeconds;
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
      this.certificateAssessmentPlayerStateService.configureForOffering(
        this.certificateOffering.timeLimitInMinutes
      );
    } catch {
      this.hasError = true;
      await this.redirectToNotFound();
    } finally {
      this.isLoading = false;
    }
  }

  /** Sends the learner to the 404 page when the offering can't be loaded. */
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
    this.certificateAssessmentPlayerStateService.showInstructions();
  }

  showIntro(): void {
    this.certificateAssessmentPlayerStateService.showIntro();
  }

  /**
   * Starts a new attempt on the server. The learner only moves to the
   * questions once the server confirms the attempt; that confirmation is
   * also what arms a fresh time window for them (see
   * `beginNewAttempt`), so a failed start leaves any existing timing
   * state untouched.
   */
  async startAssessment(): Promise<void> {
    try {
      const attempt =
        await this.certificateAssessmentOfferingBackendApiService.attemptCertificateAssessmentAsync(
          this.certificateId
        );
      this.certificateAssessmentPlayerStateService.beginNewAttempt(attempt);
    } catch {
      this.alertsService.addWarning(
        this.translateService.instant(
          'I18N_CERTIFICATE_ASSESSMENT_START_WARNING'
        )
      );
    }
  }

  /**
   * Submits the learner's final answers exactly once and navigates to the
   * result page, unless the submission raced against the expiry of the
   * time window (in which case the auto-submit keeps them on the page).
   */
  async onAssessmentSubmitted(
    answers: SubmitCertificateAssessmentAnswerBackendDict[]
  ): Promise<void> {
    const attempt = this.attempt;
    if (attempt === null || this.isSubmissionInProgress) {
      return;
    }
    const submittedBeforeExpiry = !this.isTimeExpired;
    const attemptId = attempt.attemptId;
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
    this.certificateAssessmentPlayerStateService.returnToIntroAfterRetry();
  }

  onResumeAssessment(): void {
    this.certificateAssessmentPlayerStateService.resumeQuestionsStage();
  }

  async onViewResults(): Promise<boolean> {
    await this.pendingSubmission;
    return this.navigateToResultPage();
  }

  onAssessmentEnded(): Promise<boolean> {
    return this.navigateToLearnerDashboard();
  }

  ngOnDestroy(): void {
    // Stops the countdown before the base class unsubscribes its listeners.
    this.certificateAssessmentPlayerStateService.ngOnDestroy();
    super.ngOnDestroy();
  }

  private async navigateToLearnerDashboard(): Promise<boolean> {
    return this.router.navigate([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_DASHBOARD.ROUTE}`,
    ]);
  }

  private async navigateToResultPage(): Promise<boolean> {
    const attempt = this.attempt;
    if (attempt === null) {
      return false;
    }
    return this.router.navigate([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_RESULT.ROUTE.split('/')[0]}`,
      attempt.attemptId,
    ]);
  }
}
