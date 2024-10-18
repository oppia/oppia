// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for emitting events when a skill editor tab is stale.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {StalenessDetectionService} from 'services/staleness-detection.service';
import {EntityEditorBrowserTabsInfoDomainConstants} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import {SkillEditorStateService} from './skill-editor-state.service';
import {EntityEditorBrowserTabsInfo} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import {FaviconService} from 'services/favicon.service';
import {LocalStorageService} from 'services/local-storage.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {StaleTabInfoModalComponent} from 'components/stale-tab-info/stale-tab-info-modal.component';
import {UnsavedChangesStatusInfoModalComponent} from 'components/unsaved-changes-status-info/unsaved-changes-status-info-modal.component';
import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class SkillEditorStalenessDetectionService {
  _staleTabEventEmitter = new EventEmitter<void>();
  _presenceOfUnsavedChangesEventEmitter = new EventEmitter<void>();
  // This property is initialized using init method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  unsavedChangesWarningModalRef!: NgbModalRef;

  constructor(
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private stalenessDetectionService: StalenessDetectionService,
    private skillEditorStateService: SkillEditorStateService,
    private faviconService: FaviconService,
    private localStorageService: LocalStorageService,
    private undoRedoService: UndoRedoService
  ) {}

  init(): void {
    this.staleTabEventEmitter.subscribe(() => {
      this.showStaleTabInfoModal();
    });
    this.presenceOfUnsavedChangesEventEmitter.subscribe(() => {
      this.showPresenceOfUnsavedChangesModal();
    });
  }

  showStaleTabInfoModal(): void {
    const skill = this.skillEditorStateService.getSkill();
    // Return null if skill id is not present in the local storage.
    const skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo | null =
      this.localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
        skill.getId()
      );

    if (
      skillEditorBrowserTabsInfo &&
      skillEditorBrowserTabsInfo.getLatestVersion() !== skill.getVersion()
    ) {
      this.faviconService.setFavicon(AppConstants.FAVICON_ALERT_PATH);
      this.ngbModal.dismissAll();
      const modalRef = this.ngbModal.open(StaleTabInfoModalComponent, {
        backdrop: 'static',
      });
      modalRef.componentInstance.entity = 'skill';
      modalRef.result.then(
        () => {
          this.windowRef.nativeWindow.location.reload();
        },
        () => {}
      );
    }
  }

  showPresenceOfUnsavedChangesModal(): void {
    if (this.undoRedoService.getChangeCount() !== 0) {
      return;
    }
    if (
      this.stalenessDetectionService.doesSomeOtherEntityEditorPageHaveUnsavedChanges(
        EntityEditorBrowserTabsInfoDomainConstants.OPENED_SKILL_EDITOR_BROWSER_TABS,
        this.skillEditorStateService.getSkill().getId()
      )
    ) {
      this.ngbModal.dismissAll();
      this.unsavedChangesWarningModalRef = this.ngbModal.open(
        UnsavedChangesStatusInfoModalComponent,
        {
          backdrop: 'static',
        }
      );
      this.unsavedChangesWarningModalRef.componentInstance.entity = 'skill';
      this.unsavedChangesWarningModalRef.result.then(
        () => {},
        () => {}
      );
    } else if (this.unsavedChangesWarningModalRef) {
      this.unsavedChangesWarningModalRef.dismiss();
    }
  }

  get staleTabEventEmitter(): EventEmitter<void> {
    return this._staleTabEventEmitter;
  }

  get presenceOfUnsavedChangesEventEmitter(): EventEmitter<void> {
    return this._presenceOfUnsavedChangesEventEmitter;
  }
}
