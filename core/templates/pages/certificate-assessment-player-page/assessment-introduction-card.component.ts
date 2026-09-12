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
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
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
  isLoadingTopics = true;

  // Static UI chrome text, translated via i18n keys.
  readonly demonstratesHeadingI18nKey =
    'I18N_CERTIFICATE_ASSESSMENT_DEMONSTRATES_HEADING';
  readonly continueButtonI18nKey =
    'I18N_CERTIFICATE_ASSESSMENT_CONTINUE_BUTTON';

  constructor(private classroomBackendApiService: ClassroomBackendApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadClassroomUrlFragment();
  }

  private async loadClassroomUrlFragment(): Promise<void> {
    try {
      const classroomDataResponse =
        await this.classroomBackendApiService.getClassroomDataAsync(
          this.certificateOffering.classroomId
        );
      this.classroomUrlFragment =
        classroomDataResponse.classroomDict.urlFragment;
    } catch {
      this.classroomUrlFragment = '';
    } finally {
      this.isLoadingTopics = false;
    }
  }

  onContinue(): void {
    this.continue.emit();
  }
}
