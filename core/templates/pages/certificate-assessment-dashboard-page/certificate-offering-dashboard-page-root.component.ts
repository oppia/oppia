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
 * @fileoverview Certificate-offering-dashboard-page-root component.
 */

import {Component} from '@angular/core';
import {PlatformFeatureService} from 'services/platform-feature.service';

@Component({
  selector: 'oppia-certificate-offering-dashboard-page-root',
  templateUrl: './certificate-offering-dashboard-page-root.component.html',
})
export class CertificateOfferingDashboardPageRootComponent {
  isCertificateOfferingEnabled =
    this.platformFeatureService.status.EnableCertificateAssessment.isEnabled;
  constructor(private platformFeatureService: PlatformFeatureService) {}
}
