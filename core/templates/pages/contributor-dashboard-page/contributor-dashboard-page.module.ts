// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the contributor dashboard page.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {NgbModalModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {OppiaCkEditorCopyToolBarModule} from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.module';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {ToastrModule} from 'ngx-toastr';

import {TranslationLanguageSelectorComponent} from './translation-language-selector/translation-language-selector.component';
import {ReviewTranslationLanguageSelectorComponent} from './translation-language-selector/review-translation-language-selector.component';
import {TranslationTopicSelectorComponent} from './translation-topic-selector/translation-topic-selector.component';
import {EntityTypeSelectorComponent} from './entity-type-selector/entity-type-selector.component';
import {LoginRequiredMessageComponent} from './login-required-message/login-required-message.component';
import {LoginRequiredModalContent} from './modal-templates/login-required-modal.component';
import {OpportunitiesListItemComponent} from './opportunities-list-item/opportunities-list-item.component';
import {OpportunitiesListComponent} from './opportunities-list/opportunities-list.component';
import {TranslationSuggestionReviewModalComponent} from './modal-templates/translation-suggestion-review-modal.component';
import {TranslationOpportunitiesComponent} from './translation-opportunities/translation-opportunities.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {ContributionsAndReview} from './contributions-and-review/contributions-and-review.component';
import {QuestionOpportunitiesComponent} from './question-opportunities/question-opportunities.component';
import {ContributorDashboardPageComponent} from './contributor-dashboard-page.component';
import {ContributorStatsComponent} from './contributor-stats/contributor-stats.component';
import {CertificateDownloadModalComponent} from './modal-templates/certificate-download-modal.component';
import {ContributorBadgesComponent} from './contributor-badges/contributor-badges.component';
import {BadgeComponent} from './badge/badge.component';
import {ContributorDashboardPageRootComponent} from './contributor-dashboard-page-root.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {RteHelperService} from 'services/rte-helper.service';

import {BaseModule} from 'base-components/base.module';
import {LazyLoadingModule} from 'components/shared_parts/lazy-loading.module';
import {RteHelperModalModule} from 'components/shared_parts/rte-helper-modal.module';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import {QuestionSuggestionEditorModalModule} from 'components/shared_parts/question-suggestion-editor-modal.module';
import {QuestionSuggestionReviewModalModule} from 'components/shared_parts/question-suggestion-review-modal.module';
import {QuestionsOpportunitiesSelectDifficultyModalModule} from 'components/shared_parts/questions-opportunities-select-difficulty-modal.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {TranslateModule} from '@ngx-translate/core';
import {TranslationModalModule} from 'components/shared_parts/translation-modal.module';
import {UndoSnackbarModule} from 'components/shared_parts/undo-snackbar.module';
@NgModule({
  imports: [
    UndoSnackbarModule,
    TranslationModalModule,
    TranslateModule,
    StringUtilityPipesModule,
    RteHelperModalModule,
    RichTextComponentsModule,
    QuestionsOpportunitiesSelectDifficultyModalModule,
    QuestionSuggestionReviewModalModule,
    QuestionSuggestionEditorModalModule,
    NgbPopoverModule,
    MatButtonModule,
    MatCardModule,
    LazyLoadingModule,
    BaseModule,
    CommonModule,
    FormsModule,
    InteractionExtensionsModule,
    NgbModalModule,
    NgbTooltipModule,
    SharedFormsModule,
    OppiaCkEditorCopyToolBarModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ContributorDashboardPageRootComponent,
      },
    ]),
    MatSnackBarModule,
  ],
  declarations: [
    CertificateDownloadModalComponent,
    ContributorBadgesComponent,
    EntityTypeSelectorComponent,
    LoginRequiredMessageComponent,
    LoginRequiredModalContent,
    OpportunitiesListItemComponent,
    OpportunitiesListComponent,
    ReviewTranslationLanguageSelectorComponent,
    ContributorStatsComponent,
    BadgeComponent,
    TranslationLanguageSelectorComponent,
    TranslationOpportunitiesComponent,
    TranslationSuggestionReviewModalComponent,
    TranslationTopicSelectorComponent,
    ContributionsAndReview,
    QuestionOpportunitiesComponent,
    ContributorDashboardPageComponent,
    ContributorBadgesComponent,
    ContributorDashboardPageRootComponent,
  ],
  entryComponents: [
    CertificateDownloadModalComponent,
    ContributorBadgesComponent,
    EntityTypeSelectorComponent,
    LoginRequiredMessageComponent,
    LoginRequiredModalContent,
    OpportunitiesListItemComponent,
    OpportunitiesListComponent,
    ReviewTranslationLanguageSelectorComponent,
    ContributorStatsComponent,
    BadgeComponent,
    TranslationLanguageSelectorComponent,
    TranslationOpportunitiesComponent,
    TranslationSuggestionReviewModalComponent,
    TranslationTopicSelectorComponent,
    ContributionsAndReview,
    QuestionOpportunitiesComponent,
    ContributorDashboardPageComponent,
  ],
  providers: [RteHelperService],
})
export class ContributorDashboardPageModule {}
