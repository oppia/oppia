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
 * @fileoverview Root wrapper for the certificate assessment result page.
 */

import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {AppConstants} from 'app.constants';
import {BaseRootComponent, MetaTagData} from 'pages/base-root.component';
import {PageHeadService} from 'services/page-head.service';

@Component({
  selector: 'oppia-certificate-assessment-result-page-root',
  templateUrl: './certificate-assessment-result-page-root.component.html',
})
export class CertificateAssessmentResultPageRootComponent extends BaseRootComponent {
  attemptId = '';

  title: string =
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_ASSESSMENT_RESULT
      .TITLE;

  // TODO(#26274): Make the root-page meta tag contract readonly across BaseRootComponent
  // and all subclasses, then remove this cast and align AppConstants META values.
  meta: MetaTagData[] = AppConstants.PAGES_REGISTERED_WITH_FRONTEND
    .CERTIFICATE_ASSESSMENT_RESULT.META as unknown as Readonly<MetaTagData>[];

  constructor(
    pageHeadService: PageHeadService,
    translateService: TranslateService,
    activatedRoute: ActivatedRoute
  ) {
    super(pageHeadService, translateService);
    this.attemptId = activatedRoute.snapshot.paramMap.get('attempt_id') || '';
  }
}
