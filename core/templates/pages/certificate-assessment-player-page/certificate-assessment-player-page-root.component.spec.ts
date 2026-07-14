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
 * @fileoverview Unit tests for CertificateAssessmentPlayerPageRootComponent.
 */

import {AppConstants} from 'app.constants';
import {CertificateAssessmentPlayerPageRootComponent} from './certificate-assessment-player-page-root.component';

describe('CertificateAssessmentPlayerPageRootComponent', () => {
  let component: CertificateAssessmentPlayerPageRootComponent;

  beforeEach(() => {
    component = new CertificateAssessmentPlayerPageRootComponent();
  });

  it('should set the title from AppConstants', () => {
    expect(component.title).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_PLAYER
        .TITLE
    );
  });

  it('should set the meta tags from AppConstants', () => {
    expect(component.meta).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_PLAYER
        .META as unknown as typeof component.meta
    );
  });
});
