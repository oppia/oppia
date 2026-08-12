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
 * @fileoverview Module for the assessment player page.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {RouterModule} from '@angular/router';
import {CertificateOfferingSharedModule} from 'components/certificate-assessment-offering-helper/certificate-offering-shared.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {CertificateAssessmentPlayerPageRootComponent} from './certificate-assessment-player-page-root.component';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';
import {AssessmentIntroductionCardComponent} from './assessment-introduction-card.component';
import {AssessmentInstructionPanelComponent} from './assessment-instruction-panel.component';
import {CertificateAssessmentConversationSkinComponent} from './certificate-assessment-conversation-skin.component';
import {CertificateAssessmentPlayerPageAuthGuard} from './certificate-assessment-player-page-auth.guard';
import {CertificateAssessmentTitledBackgroundBannerComponent} from 'components/certificate-assessment-offering-helper/certificate-assessment-titled-shared-background-banner.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    MatBottomSheetModule,
    SharedComponentsModule,
    CertificateOfferingSharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: CertificateAssessmentPlayerPageRootComponent,
        canActivate: [CertificateAssessmentPlayerPageAuthGuard],
      },
      {
        path: 'session',
        component: CertificateAssessmentPlayerPageRootComponent,
        canActivate: [CertificateAssessmentPlayerPageAuthGuard],
      },
    ]),
    TranslateModule,
  ],
  declarations: [
    CertificateAssessmentPlayerPageRootComponent,
    CertificateAssessmentPlayerPageComponent,
    AssessmentIntroductionCardComponent,
    AssessmentInstructionPanelComponent,
    CertificateAssessmentConversationSkinComponent,
    CertificateAssessmentTitledBackgroundBannerComponent,
  ],
  entryComponents: [
    CertificateAssessmentPlayerPageRootComponent,
    CertificateAssessmentPlayerPageComponent,
    AssessmentIntroductionCardComponent,
    AssessmentInstructionPanelComponent,
    CertificateAssessmentConversationSkinComponent,
    CertificateAssessmentTitledBackgroundBannerComponent,
  ],
})
export class CertificateAssessmentPlayerPageModule {}
