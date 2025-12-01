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

import {Component, OnInit, Optional} from '@angular/core';
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
import {NewFlagExplorationModalComponent} from './flag-lesson-modal.component';
import {LessonFeedbackModalComponent} from './lesson-feedback-modal.component';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';

const MOBILE_SCREEN_BREAKPOINT = 480;

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
  explorationId!: string;
  avgRating!: number | null;
  fullStars: number = 0;
  blankStars: number = 5;

  constructor(
    private mobileMenuService: MobileMenuService,
    private pageContextService: PageContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
    @Optional() private ngbModal: NgbModal,
    @Optional() private bottomSheet: MatBottomSheet,
    private conversationFlowService: ConversationFlowService,
    private windowDimensionsService: WindowDimensionsService
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

  toggleSidebar(): void {
    this.mobileMenuService.toggleSidebar();
    this.sidebarIsExpanded = this.mobileMenuService.getSidebarIsExpanded();
  }

  isHackyExpDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  showShareLessonModal():
    | NgbModalRef
    | MatBottomSheetRef<ShareLessonModalComponent> {
    if (this.isMobileScreenSize()) {
      const bottomSheetRef = this.bottomSheet.open(ShareLessonModalComponent, {
        data: {
          explorationTitle: this.explorationTitle,
        },
      });
      return bottomSheetRef;
    } else {
      let modalRef: NgbModalRef = this.ngbModal.open(
        ShareLessonModalComponent,
        {
          backdrop: 'static',
        }
      );
      modalRef.componentInstance.explorationTitle = this.explorationTitle;
      return modalRef;
    }
  }

  showFlagExplorationModal():
    | NgbModalRef
    | MatBottomSheetRef<NewFlagExplorationModalComponent> {
    if (this.isMobileScreenSize()) {
      const bottomSheetRef = this.bottomSheet.open(
        NewFlagExplorationModalComponent
      );
      return bottomSheetRef;
    } else {
      const modalRef = this.ngbModal.open(NewFlagExplorationModalComponent, {
        backdrop: 'static',
      });
      return modalRef;
    }
  }

  showFeedbackModal():
    | NgbModalRef
    | MatBottomSheetRef<LessonFeedbackModalComponent> {
    if (this.isMobileScreenSize()) {
      const bottomSheetRef = this.bottomSheet.open(
        LessonFeedbackModalComponent
      );
      return bottomSheetRef;
    } else {
      const modalRef = this.ngbModal.open(LessonFeedbackModalComponent, {
        backdrop: 'static',
      });
      return modalRef;
    }
  }

  isMobileScreenSize(): boolean {
    return this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT;
  }

  isUserLoggedIn(): boolean {
    return this.conversationFlowService.getIsLoggedIn();
  }
}
