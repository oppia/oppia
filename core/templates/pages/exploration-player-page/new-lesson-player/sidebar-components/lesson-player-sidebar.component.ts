// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the new lesson player sidebar
 */

import {Component, OnInit} from '@angular/core';
import {MobileMenuService} from '../../services/mobile-menu.service';
import './lesson-player-sidebar.component.css';
import {PageContextService} from 'services/page-context.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ShareLessonModalComponent} from './share-lesson-modal.component';
import {
  FlagExplorationModalResult,
  NewFlagExplorationModalComponent,
} from './flag-exploration-modal.component';
import {LearnerLocalNavBackendApiService} from 'pages/exploration-player-page/services/learner-local-nav-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {CustomizableThankYouModalComponent} from './customizable-thank-you-modal.component';
import {LessonFeedbackModalComponent} from './lesson-feedback-modal.component';

@Component({
  selector: 'oppia-lesson-player-sidebar',
  templateUrl: './lesson-player-sidebar.component.html',
  styleUrls: ['./lesson-player-sidebar.component.css'],
})
export class LessonPlayerSidebarComponent implements OnInit {
  mobileMenuVisible: boolean = false;
  sidebarIsExpanded: boolean = false;
  expDescription!: string;
  expDescTranslationKey!: string;
  explorationTitle!: string;
  explorationId: string;
  avgRating!: number | null;
  fullStars: number = 0;
  blankStars: number = 5;

  constructor(
    private mobileMenuService: MobileMenuService,
    private pageContextService: PageContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
    private ngbModal: NgbModal,
    private learnerLocalNavBackendApiService: LearnerLocalNavBackendApiService,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.mobileMenuService.getMenuVisibility().subscribe(visibility => {
      this.mobileMenuVisible = visibility;
    });

    this.explorationId = this.pageContextService.getExplorationId();
    this.expDescription = 'Loading...';
    this.explorationTitle = 'Loading...';
    this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(
        this.explorationId,
        this.urlService.getExplorationVersionFromUrl(),
        this.urlService.getPidFromUrl()
      )
      .then(response => {
        this.expDescription = response.exploration.objective;
        this.explorationTitle = response.exploration.title;
      });
    this.expDescTranslationKey =
      this.i18nLanguageCodeService.getExplorationTranslationKey(
        this.explorationId,
        TranslationKeyType.DESCRIPTION
      );
  }

  showShareLessonModal(): NgbModalRef {
    let modalRef: NgbModalRef = this.ngbModal.open(ShareLessonModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.explorationTitle = this.explorationTitle;
    return modalRef;
  }

  toggleSidebar(): void {
    this.sidebarIsExpanded = !this.sidebarIsExpanded;
  }

  isHackyExpDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  showFlagExplorationModal(): void {
    const modalRef = this.ngbModal.open(NewFlagExplorationModalComponent, {
      backdrop: 'static',
    });

    modalRef.result.then(
      (result: FlagExplorationModalResult) => {
        this.learnerLocalNavBackendApiService
          .postReportAsync(this.explorationId, result)
          .then(
            () => {},
            error => {
              this.alertsService.addWarning(error);
            }
          );

        const thankYouModalRef = this.ngbModal.open(
          CustomizableThankYouModalComponent,
          {
            backdrop: true,
          }
        );

        thankYouModalRef.componentInstance.modalMessageI18nKey =
          'I18N_PLAYER_REPORT_SUCCESS_MODAL_BODY';
      },
      () => {}
    );
  }

  showFeedbackModal(): void {
    const modalRef = this.ngbModal.open(LessonFeedbackModalComponent, {
      backdrop: 'static',
    });

    modalRef.result.then(
      () => {
        const thankYouModalRef = this.ngbModal.open(
          CustomizableThankYouModalComponent,
          {
            backdrop: true,
          }
        );

        thankYouModalRef.componentInstance.modalMessageI18nKey =
          'I18N_PLAYER_THANK_FEEDBACK';
      },
      () => {}
    );
  }
}
