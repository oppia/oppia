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
 * @fileoverview Unit tests for CertificateAssessmentResultPageRootComponent.
 */

import {AppConstants} from 'app.constants';
import {TranslateService} from '@ngx-translate/core';
import {PageHeadService} from 'services/page-head.service';
import {CertificateAssessmentResultPageRootComponent} from './certificate-assessment-result-page-root.component';

describe('CertificateAssessmentResultPageRootComponent', () => {
  let component: CertificateAssessmentResultPageRootComponent;

  beforeEach(() => {
    component = new CertificateAssessmentResultPageRootComponent(
      {} as PageHeadService,
      {} as TranslateService,
      {
        snapshot: {
          paramMap: {
            get: (name: string) => {
              if (name === 'attempt_id') {
                return 'attempt-1';
              }
              return null;
            },
          },
        },
      } as never
    );
  });

  it('should set the title from AppConstants', () => {
    expect(component.title).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_RESULT
        .TITLE
    );
  });

  it('should set the attempt id from the route', () => {
    expect(component.attemptId).toBe('attempt-1');
  });

  it('should fall back to an empty attempt id when the route param is missing', () => {
    component = new CertificateAssessmentResultPageRootComponent(
      {} as PageHeadService,
      {} as TranslateService,
      {
        snapshot: {
          paramMap: {
            get: () => null,
          },
        },
      } as never
    );

    expect(component.attemptId).toBe('');
  });
});
