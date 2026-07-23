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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import './assessment-introduction-card.component.css';

// TODO(##24717-M2.15): This is a stubbed structure for a recommended topic tile.
// Once the backend endpoint that fetches
// CertificateAssessmentOfferingModel data is wired up, this should be
// replaced with the real topic summary type (e.g. name, lesson count and
// a thumbnail/color derived from the topic's actual data).
interface RecommendedTopicStub {
  name: string;
  lessonCount: number;
  // Placeholder swatch shown instead of a topic thumbnail image.
  colorClass: string;
}

@Component({
  selector: 'oppia-assessment-introduction-card',
  templateUrl: './assessment-introduction-card.component.html',
  styleUrls: ['./assessment-introduction-card.component.css'],
})
export class AssessmentIntroductionCardComponent {
  @Input() certificateId = '';
  @Output() continue = new EventEmitter<void>();

  // Static UI chrome text, translated via i18n keys.
  readonly demonstratesHeadingI18nKey =
    'I18N_CERTIFICATE_ASSESSMENT_DEMONSTRATES_HEADING';
  readonly topicsHeadingI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_TOPICS_HEADING';
  readonly topicsSubtextI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_TOPICS_SUBTEXT';
  readonly continueButtonI18nKey =
    'I18N_CERTIFICATE_ASSESSMENT_CONTINUE_BUTTON';

  // TODO(##24717-M2.15): Everything below will eventually be populated from
  // the CertificateAssessmentOfferingModel record identified by
  // this.certificateId, once the corresponding backend handler and
  // domain object/frontend service are available. For now this is
  // hardcoded so the UI can be built and reviewed independently.
  certificateTitle = 'Everyday Arithmetic & Number Confidence';

  certificateDescription =
    'This certificate recognizes your ability to work confidently with ' +
    'numbers in everyday situations, including basic operations and ' +
    'number reasoning.';

  demonstratesList: string[] = [
    'Understanding of numbers and their relationships',
    'Ability to perform basic arithmetic accurately',
    'Confidence solving everyday numerical problems',
  ];

  recommendedTopics: RecommendedTopicStub[] = [
    {name: 'Place Values', lessonCount: 5, colorClass: 'topic-color-1'},
    {
      name: 'Addition and Subtraction',
      lessonCount: 7,
      colorClass: 'topic-color-2',
    },
    {name: 'Multiplication', lessonCount: 7, colorClass: 'topic-color-3'},
    {name: 'Fractions', lessonCount: 12, colorClass: 'topic-color-4'},
  ];

  onContinue(): void {
    this.continue.emit();
  }
}
