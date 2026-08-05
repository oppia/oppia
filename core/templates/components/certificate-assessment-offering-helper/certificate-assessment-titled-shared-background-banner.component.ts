// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Shared, reusable banner + page-title header. Renders the
 * decorative <background-banner> together with a centered <h1> title and a
 * single nav button (e.g. "Exit" or "Back"). The empty column on the
 * opposite side of the button keeps the title visually centered on the
 * page rather than centered in the remaining space next to the button.
 */

import {Component, Input} from '@angular/core';
import './certificate-assessment-titled-shared-background-banner.component.css';

@Component({
  selector: 'oppia-titled-background-banner',
  templateUrl:
    './certificate-assessment-titled-shared-background-banner.component.html',
  styleUrls: [
    './certificate-assessment-titled-shared-background-banner.component.css',
  ],
})
export class CertificateAssessmentTitledBackgroundBannerComponent {
  @Input() title: string = '';
  @Input() buttonText: string = 'I18N_CERTIFICATE_ASSESSMENT_EXIT_BUTTON';
  @Input() buttonRoute: string[] = [];
}
