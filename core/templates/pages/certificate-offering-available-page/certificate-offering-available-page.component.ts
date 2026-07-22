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
 * @fileoverview Certificate offering available page component.
 */

import {Component, Input} from '@angular/core';
import './certificate-offering-available-page.component.css';

export type CertificateAssessmentStatus = 'passed' | 'failed' | 'not_attempted';

export interface AvailableCertificate {
  id: string;
  title: string;
  status: CertificateAssessmentStatus;
  assessmentRoute: string[];
  passedOnDate?: string;
  failedOnDate?: string;
}

@Component({
  selector: 'oppia-available-certificate-offering-page',
  templateUrl: './certificate-offering-available-page.component.html',
  styleUrls: ['./certificate-offering-available-page.component.css'],
})
export class AvailableCertificateOfferingPageComponent {
  @Input() classroomUrlFragment: string = '';

  availableCertificates: AvailableCertificate[] = [
    {
      id: 'everyday_arithmetic_number_confidence',
      title: 'Everyday Arithmetic & Number Confidence',
      assessmentRoute: [
        '/certificate-assessment',
        'everyday_arithmetic_number_confidence',
      ],
      status: 'passed',
      passedOnDate: 'Jan 16, 2026',
    },
    {
      id: 'fractions_decimals_fundamentals',
      title: 'Fractions & Decimals Fundamentals',
      assessmentRoute: [
        '/certificate-assessment',
        'fractions_decimals_fundamentals',
      ],
      status: 'not_attempted',
    },
    {
      id: 'geometry_measurement_basics',
      title: 'Geometry & Measurement Basics',
      assessmentRoute: [
        '/certificate-assessment',
        'geometry_measurement_basics',
      ],
      status: 'failed',
      failedOnDate: 'Feb 2, 2026',
    },
  ];

  getCertificateAssessmentRoute(certificateId: string): string[] {
    return ['/certificate-assessment', certificateId];
  }
}
