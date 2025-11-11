// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for share lesson modal in the new lesson player.
 */

import {Component, Inject, Optional} from '@angular/core';
import './share-lesson-modal.component.css';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {AttributionService} from 'services/attribution.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageContextService} from 'services/page-context.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

enum SuccessMessages {
  LINK_COPIED = 'Link Copied',
  EMBED_CODE_COPIED = 'HTML Code Copied',
  ATTRIBUTION_COPIED = 'Attribution Copied',
}

enum ModalStates {
  COPY = 'copy',
  EMBED = 'embed',
  ATTRIBUTION = 'attribution',
}

const MOBILE_SCREEN_BREAKPOINT = 480;

@Component({
  selector: 'oppia-share-lesson-modal',
  templateUrl: './share-lesson-modal.component.html',
  styleUrls: ['./share-lesson-modal.component.css'],
})
export class ShareLessonModalComponent {
  modalStates = ModalStates;
  explorationTitle!: string;
  backBtnIsVisible: boolean = false;
  successMessageIsVisible: boolean = false;
  successMessage: string = '';
  ccAttributionText: string = '';
  embedCode: string = '';
  modalState: ModalStates = ModalStates.COPY;

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DATA)
    private data: {
      explorationTitle: string;
    },
    private alertsService: AlertsService,
    private urlService: UrlService,
    private attributionService: AttributionService,
    private windowRef: WindowRef,
    private pageContextService: PageContextService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    if (this.data?.explorationTitle !== undefined) {
      this.explorationTitle = this.data.explorationTitle;
    }

    this.generateAttributionText();
    this.generateEmbedCode();
  }

  closeModal(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    } else {
      this.ngbActiveModal.dismiss('cancel');
    }
  }

  copyLessonLink(): void {
    const lessonLink = this.getPageUrl();
    navigator.clipboard.writeText(lessonLink).then(
      () => {
        this.showSuccessMessage(SuccessMessages.LINK_COPIED);
      },
      () => {
        this.alertsService.addWarning('Failed to copy lesson link.');
      }
    );
  }

  showModal(state: ModalStates): void {
    this.modalState = state;
  }

  copyAttribution(): void {
    navigator.clipboard.writeText(this.ccAttributionText).then(
      () => {
        this.showSuccessMessage(SuccessMessages.ATTRIBUTION_COPIED);
      },
      () => {
        this.alertsService.addWarning('Failed to copy attribution text.');
      }
    );
  }

  copyEmbedCode(): void {
    navigator.clipboard.writeText(this.embedCode).then(
      () => {
        this.showSuccessMessage(SuccessMessages.EMBED_CODE_COPIED);
      },
      () => {
        this.alertsService.addWarning('Failed to copy embed code.');
      }
    );
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.successMessageIsVisible = true;

    setTimeout(() => {
      this.successMessageIsVisible = false;
    }, 3000);
  }

  showAttributionModal(): void {
    this.backBtnIsVisible = true;
    this.showModal(ModalStates.ATTRIBUTION);
  }

  showEmbedModal(): void {
    this.backBtnIsVisible = true;
    this.showModal(ModalStates.EMBED);
  }

  goBackToCopyModal(): void {
    this.backBtnIsVisible = false;
    this.showModal(ModalStates.COPY);
  }

  shareWithNetwork(network: string): string {
    let queryString: string;
    let url = this.getPageUrl();
    switch (network) {
      case 'facebook':
        queryString =
          'sdk=joey&' +
          `u=${url}&` +
          'display=popup&' +
          'ref=plugin&' +
          'src=share_button';

        return `https://www.facebook.com/sharer/sharer.php?${queryString}`;
      case 'classroom':
        queryString = `url=${url}`;
        return `https://classroom.google.com/share?${queryString}`;
    }
    return '';
  }

  getPageUrl(): string {
    const url = this.urlService.getCurrentLocation();
    return url.origin + url.pathname;
  }

  getAuthors(): string {
    return this.attributionService.getAuthors().join(', ');
  }

  generateEmbedCode(): void {
    const explorationId = this.pageContextService.getExplorationId();
    const serverName =
      this.windowRef.nativeWindow.location.protocol +
      '//' +
      this.windowRef.nativeWindow.location.host;
    this.embedCode = `<iframe src="${serverName}/embed/exploration/${explorationId}" width="700" height="1000"></iframe>`;
  }

  generateAttributionText(): void {
    this.ccAttributionText = `"${this.explorationTitle}" by ${this.getAuthors()}. Oppia. ${this.getPageUrl()}`;
  }

  isWindowNarrow(): boolean {
    return this.windowDimensionsService.getWidth() > MOBILE_SCREEN_BREAKPOINT;
  }
}
