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
 * @fileoverview Unit tests for exploration editor staleness detection service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FaviconService } from 'services/favicon.service';
import { LocalStorageService } from 'services/local-storage.service';
import { StalenessDetectionService } from 'services/staleness-detection.service';
import { ChangeListService } from './change-list.service';
import { ExplorationEditorStalenessDetectionService } from './exploration-editor-staleness-detection.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      reload: () => {},
      pathname: ''
    }
  };
}

class MockChangeListSerivce {
  getChangeList() {
    return [];
  }
}

describe('Exploration editor staleness detection service', () => {
  let explorationEditorStalenessDetectionService:
    ExplorationEditorStalenessDetectionService;
  let localStorageService: LocalStorageService;
  let changeListService: MockChangeListSerivce;
  let windowRef: MockWindowRef;
  let faviconService: FaviconService;
  let ngbModal: NgbModal;
  let stalenessDetectionService: StalenessDetectionService;

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    changeListService = new MockChangeListSerivce();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        NgbModal,
        { provide: ChangeListService, useValue: changeListService },
        { provide: WindowRef, useValue: windowRef },
        StalenessDetectionService,
        FaviconService,
        LocalStorageService,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    explorationEditorStalenessDetectionService = TestBed.inject(
      ExplorationEditorStalenessDetectionService);
    localStorageService = TestBed.inject(LocalStorageService);
    changeListService = TestBed.inject(ChangeListService);
    faviconService = TestBed.inject(FaviconService);
    ngbModal = TestBed.inject(NgbModal);
    stalenessDetectionService = TestBed.inject(StalenessDetectionService);

    spyOn(windowRef.nativeWindow.location, 'reload');
    spyOn(faviconService, 'setFavicon').and.callFake(() => {});
    spyOn(
      explorationEditorStalenessDetectionService, 'showStaleTabInfoModal'
    ).and.callThrough();
    spyOn(
      explorationEditorStalenessDetectionService,
      'showPresenceOfUnsavedChangesModal'
    ).and.callThrough();
    spyOn(
      stalenessDetectionService,
      'doesSomeOtherEntityEditorPageHaveUnsavedChanges'
    ).and.returnValues(true, false);
  });

  it('should show stale tab info modal and change the favicon', () => {
    let explorationEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'exploration', 'exp_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(explorationEditorBrowserTabsInfo);
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);

    explorationEditorStalenessDetectionService.init();
    explorationEditorStalenessDetectionService.setExplorationIdAndVersion(
      'exp_id', 1);
    explorationEditorStalenessDetectionService.staleTabEventEmitter.emit();

    expect(
      explorationEditorStalenessDetectionService.showStaleTabInfoModal
    ).toHaveBeenCalled();
    expect(faviconService.setFavicon).toHaveBeenCalledWith(
      '/assets/images/favicon_alert/favicon_alert.ico');
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open or close presence of unsaved changes info modal ' +
  'depending on the presence of unsaved changes on some other tab', () => {
    let explorationEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'exploration', 'exp_id', 2, 2, true);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(explorationEditorBrowserTabsInfo);
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
      dismiss() {}
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModalRef, 'dismiss');
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);

    explorationEditorStalenessDetectionService.init();
    explorationEditorStalenessDetectionService.setExplorationIdAndVersion(
      'exp_id', 2);
    explorationEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(
      explorationEditorStalenessDetectionService
        .showPresenceOfUnsavedChangesModal
    ).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();

    explorationEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(ngbModalRef.dismiss).toHaveBeenCalled();
  });
});
