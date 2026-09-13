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
 * @fileoverview Component for the assessment introduction card.
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AppConstants} from 'app.constants';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import './assessment-introduction-card.component.css';

@Component({
  selector: 'oppia-assessment-introduction-card',
  templateUrl: './assessment-introduction-card.component.html',
  styleUrls: ['./assessment-introduction-card.component.css'],
})
export class AssessmentIntroductionCardComponent implements OnInit {
  @Input() certificateOffering!: CertificateAssessmentOfferingData;
  @Output() continue = new EventEmitter<void>();

  classroomUrlFragment = '';
  recommendedTopicSummaries: CreatorTopicSummary[] = [];
  isLoadingTopics = true;

  // Static UI chrome text, translated via i18n keys.
  readonly demonstratesHeadingI18nKey =
    'I18N_CERTIFICATE_ASSESSMENT_DEMONSTRATES_HEADING';
  readonly topicsHeadingI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_TOPICS_HEADING';
  readonly topicsSubtextI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_TOPICS_SUBTEXT';
  readonly continueButtonI18nKey =
    'I18N_CERTIFICATE_ASSESSMENT_CONTINUE_BUTTON';
  readonly lessonsCountI18nKey = 'I18N_COUNT_OF_LESSONS';

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadRecommendedTopics();
  }

  private async loadRecommendedTopics(): Promise<void> {
    try {
      const classroomDataResponse =
        await this.classroomBackendApiService.getClassroomDataAsync(
          this.certificateOffering.classroomId
        );
      this.classroomUrlFragment =
        classroomDataResponse.classroomDict.urlFragment;
      const classroomData =
        await this.classroomBackendApiService.fetchClassroomDataAsync(
          this.classroomUrlFragment
        );
      const offeringTopicIds = Object.keys(this.certificateOffering.topicData);
      this.recommendedTopicSummaries = classroomData
        .getTopicSummaries()
        .filter(topicSummary =>
          offeringTopicIds.includes(topicSummary.getId())
        );
    } catch {
      this.recommendedTopicSummaries = [];
    } finally {
      this.isLoadingTopics = false;
    }
  }

  getTopicThumbnailUrl(topicSummary: CreatorTopicSummary): string {
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.TOPIC,
      topicSummary.getId(),
      topicSummary.getThumbnailFilename()
    );
  }

  onContinue(): void {
    this.continue.emit();
  }
}
