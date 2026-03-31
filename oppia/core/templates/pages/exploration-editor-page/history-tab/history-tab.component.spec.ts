// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the exploration history tab.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {EditabilityService} from 'services/editability.service';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {HistoryTabComponent} from './history-tab.component';
import {HistoryTabBackendApiService} from '../services/history-tab-backend-api.service';
import {CompareVersionsService} from './services/compare-versions.service';
import {ExplorationDataService} from '../services/exploration-data.service';
import {RouterService} from '../services/router.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

class MockNgbModalRef {
  componentInstance: {
    version: null;
  };
}

class MockNgbModal {
  open(): Promise<void> {
    return Promise.resolve();
  }
}

describe('History tab component', () => {
  let component: HistoryTabComponent;
  let fixture: ComponentFixture<HistoryTabComponent>;
  let ngbModal: NgbModal;
  let compareVersionsService: CompareVersionsService;
  let editabilityService: EditabilityService;
  let dateTimeFormatService: DateTimeFormatService;
  let windowRef: WindowRef;
  let historyTabBackendApiService: HistoryTabBackendApiService;

  let mockRefreshVersionHistoryEmitter = new EventEmitter();
  let explorationId = 'exp1';
  let snapshots = [
    {
      commit_message: 'This is the commit message',
      committer_id: 'committer_3',
      commit_type: '',
      version_number: 1,
      created_on_ms: 1416563100000,
      commit_cmds: [],
    },
    {
      commit_message: 'This is the commit message 2',
      committer_id: 'committer_3',
      commit_type: '',
      version_number: 2,
      created_on_ms: 1416563100000,
      commit_cmds: [],
    },
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [HistoryTabComponent],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: explorationId,
            data: {
              version: 2,
            },
            getDataAsync: () =>
              Promise.resolve({
                version: 2,
              }),
          },
        },
        {
          provide: RouterService,
          useValue: {
            onRefreshVersionHistory: mockRefreshVersionHistoryEmitter,
            getActiveTabName() {
              return 'main';
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryTabComponent);
    component = fixture.componentInstance;

    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    editabilityService = TestBed.inject(EditabilityService);
    windowRef = TestBed.inject(WindowRef);
    ngbModal = TestBed.inject(NgbModal);
    compareVersionsService = TestBed.inject(CompareVersionsService);
    historyTabBackendApiService = TestBed.inject(HistoryTabBackendApiService);

    spyOn(dateTimeFormatService, 'getLocaleDateTimeHourString').and.returnValue(
      '11/21/2014'
    );
    fixture.detectChanges();

    component.diffData = {
      v1Metadata: null,
      v2Metadata: null,
    };
    component.compareVersionMetadata = {
      earlierVersion: 2,
      laterVersion: 3,
    };
    component.selectedVersionsArray = [1, 4];
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize controller properties after its initialization', () => {
    expect(component.explorationId).toBe(explorationId);
    expect(component.explorationAllSnapshotsUrl).toBe(
      '/createhandler/snapshots/exp1'
    );
    expect(component.revertExplorationUrl).toBe('/createhandler/revert/exp1');
    expect(component.explorationDownloadUrl).toBe(
      '/createhandler/download/exp1'
    );

    expect(component.explorationVersionMetadata).toBe(null);
    expect(component.versionCheckboxArray).toEqual([]);
    expect(component.displayedCurrentPageNumber).toBe(1);
    expect(component.versionNumbersToDisplay).toEqual([]);
  });

  it(
    'should refresh version history when refreshVersionHistory flag is' +
      ' broadcasted and force refresh is true',
    fakeAsync(() => {
      spyOn(historyTabBackendApiService, 'getData').and.returnValue(
        Promise.resolve({
          summaries: [],
          snapshots: snapshots,
        })
      );

      component.refreshVersionHistory();

      let data = {
        forceRefresh: true,
      };

      mockRefreshVersionHistoryEmitter.emit(data);
      tick();

      expect(component.currentVersion).toBe(2);
      expect(component.hideHistoryGraph).toBe(true);
      expect(component.comparisonsAreDisabled).toBe(false);
    })
  );

  it('should compare selected versions successfully', fakeAsync(() => {
    component.selectedVersionsArray = [3, 4, 5, 6];
    spyOn(component, 'changeCompareVersion').and.stub();
    component.comparisonsAreDisabled = false;
    component.explorationSnapshots = [
      {
        version_number: 1,
        committer_id: 'committer_id',
        created_on_ms: 10,
        commit_cmds: null,
        commit_type: null,
        commit_message: 'message',
      },
      {
        version_number: 1,
        committer_id: 'committer_id',
        created_on_ms: 10,
        commit_cmds: null,
        commit_type: null,
        commit_message: 'message',
      },
      {
        version_number: 1,
        committer_id: 'committer_id',
        created_on_ms: 10,
        commit_cmds: null,
        commit_type: null,
        commit_message: 'message',
      },
    ];

    spyOn(historyTabBackendApiService, 'getData').and.returnValue(
      Promise.resolve({
        summaries: [],
        snapshots: snapshots,
      })
    );

    component.refreshVersionHistory();

    component.changeSelectedVersions(
      {
        versionNumber: 1,
        committerId: 'committer_3',
        createdOnMsecsStr: '11/21/2014',
        commitMessage: 'This is the commit message',
      },
      1
    );

    component.changeSelectedVersions(
      {
        versionNumber: 2,
        committerId: 'committer_3',
        createdOnMsecsStr: '11/21/2014',
        commitMessage: 'This is the commit message',
      },
      2
    );

    spyOn(compareVersionsService, 'getDiffGraphData').and.returnValue(
      Promise.resolve(null)
    );

    component.compareSelectedVersions();
    component.changeCompareVersion();

    tick();

    expect(component.hideHistoryGraph).toBe(true);
    expect(component.diffData).toEqual({v1Metadata: null, v2Metadata: null});

    expect(component.earlierVersionHeader).toBe(undefined);
    expect(component.laterVersionHeader).toBe(undefined);
  }));

  it('should show exploration metadata diff modal', () => {
    spyOn(component, 'changeItemsPerPage').and.stub();
    spyOn(historyTabBackendApiService, 'getData').and.returnValue(
      Promise.resolve({
        summaries: [],
        snapshots: snapshots,
      })
    );

    component.VERSIONS_PER_PAGE = 2;
    component.paginator({
      previousPageIndex: 0,
      pageIndex: 0,
      pageSize: 0,
      length: 0,
    });
    component.refreshVersionHistory();

    component.changeSelectedVersions(
      {
        committerId: 'committer_3',
        createdOnMsecsStr: '11/21/2014',
        commitMessage: 'This is the commit message',
        versionNumber: 1,
      },
      1
    );

    component.changeSelectedVersions(
      {
        committerId: 'committer_3',
        createdOnMsecsStr: '11/21/2014',
        commitMessage: 'This is the commit message',
        versionNumber: 2,
      },
      2
    );

    spyOn(compareVersionsService, 'getDiffGraphData').and.returnValue(
      Promise.resolve(null)
    );
    component.compareSelectedVersions();
    component.changeCompareVersion();

    const spyObj = spyOn(ngbModal, 'open').and.callFake(() => {
      return {
        componentInstance: {
          oldMetadata: null,
          newMetadata: null,
          headers: null,
        },
        result: Promise.resolve(),
      } as NgbModalRef;
    });

    component.diffData = {
      v1Metadata: null,
      v2Metadata: null,
    };
    component.showExplorationMetadataDiffModal();

    expect(spyObj).toHaveBeenCalled();
  });

  it('should open a new tab for download exploration with version', () => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      open: jasmine.createSpy('open', () => {}),
    });
    component.downloadExplorationWithVersion(1);

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/createhandler/download/exp1?v=1',
      '&output_format=zip'
    );
  });

  it('should open check revert exploration modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.resolve(),
    } as NgbModalRef);

    component.showCheckRevertExplorationModal(1);

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should not open revert exploration model when exploration is invalid', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.resolve(1),
      close: () => {},
    } as NgbModalRef);
    spyOn(component, 'showRevertExplorationModal');
    const historyBackendCall = spyOn(
      historyTabBackendApiService,
      'getCheckRevertValidData'
    ).and.returnValue(Promise.resolve({valid: false, details: 'details'}));

    component.showCheckRevertExplorationModal(1);
    tick();

    expect(historyBackendCall).toHaveBeenCalled();
    expect(component.showRevertExplorationModal).not.toHaveBeenCalled();
  }));

  it('should open revert exploration modal when exploration is valid', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.resolve(1),
      close: () => {},
    } as NgbModalRef);
    spyOn(component, 'showRevertExplorationModal');
    const historyBackendCall = spyOn(
      historyTabBackendApiService,
      'getCheckRevertValidData'
    ).and.returnValue(Promise.resolve({valid: true, details: null}));

    component.showCheckRevertExplorationModal(1);
    tick();

    expect(historyBackendCall).toHaveBeenCalled();
    expect(component.showRevertExplorationModal).toHaveBeenCalled();
  }));

  it('should reload page when closing revert exploration modal', fakeAsync(() => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: jasmine.createSpy('reload', () => {}),
      },
    });
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.resolve(1),
    } as NgbModalRef);

    let spyObj = spyOn(historyTabBackendApiService, 'postData').and.returnValue(
      Promise.resolve(null)
    );

    component.showRevertExplorationModal(1);
    tick();

    expect(spyObj).toHaveBeenCalled();
    expect(windowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should not reload page when dismissing revert exploration modal', () => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: jasmine.createSpy('reload', () => {}),
      },
    });
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject(),
    } as NgbModalRef);

    component.showRevertExplorationModal(1);

    expect(windowRef.nativeWindow.location.reload).not.toHaveBeenCalled();
  });

  it('should return if the content is editable', () => {
    spyOn(editabilityService, 'isEditable').and.returnValue(false);
    expect(component.isEditable()).toEqual(false);
  });

  it('should filter the history by username', () => {
    let snapshots = [
      {
        commit_message: 'This is the commit message',
        committerId: 'committer_3',
        commit_type: '',
        version_number: 1,
        created_on_ms: 1416563100000,
        commit_cmds: [],
      },
      {
        commit_message: 'This is the commit message 2',
        committerId: 'committer_3',
        commit_type: '',
        version_number: 2,
        created_on_ms: 1416563100000,
        commit_cmds: [],
      },
      {
        commit_message: 'This is the commit message 2',
        committerId: 'committer_1',
        commit_type: '',
        version_number: 2,
        created_on_ms: 1416563100000,
        commit_cmds: [],
      },
    ];
    component.totalExplorationVersionMetadata = snapshots;
    component.username = '';
    component.filterByUsername();
    expect(component.explorationVersionMetadata).toEqual(snapshots);

    component.username = 'committer_3';
    component.filterByUsername();
    expect(component.explorationVersionMetadata).toEqual([
      snapshots[0],
      snapshots[1],
    ]);

    component.username = 'committer_1';
    component.filterByUsername();
    expect(component.explorationVersionMetadata).toEqual([snapshots[2]]);
  });

  it('should reset the graph', () => {
    component.hideHistoryGraph = false;
    component.resetGraph();
    expect(component.hideHistoryGraph).toBe(true);
  });

  it('should reverse the array when the date filter is applied', () => {
    let snapshots = [
      {
        commit_message: 'This is the commit message',
        committerId: 'committer_3',
        commit_type: '',
        version_number: 1,
        created_on_ms: 1416563100000,
        commit_cmds: [],
      },
      {
        commit_message: 'This is the commit message 2',
        committerId: 'committer_3',
        commit_type: '',
        version_number: 2,
        created_on_ms: 1416563100000,
        commit_cmds: [],
      },
      {
        commit_message: 'This is the commit message 2',
        committerId: 'committer_1',
        commit_type: '',
        version_number: 3,
        created_on_ms: 1416563100000,
        commit_cmds: [],
      },
    ];
    component.explorationVersionMetadata = snapshots;
    component.reverseDateOrder();
    expect(component.explorationVersionMetadata[0].version_number).toEqual(3);
    expect(component.explorationVersionMetadata[2].version_number).toEqual(1);

    component.reverseDateOrder();
    expect(component.explorationVersionMetadata[0].version_number).toEqual(1);
    expect(component.explorationVersionMetadata[2].version_number).toEqual(3);
  });

  it('should find the versions to compare', fakeAsync(() => {
    spyOn(component, 'getVersionHeader').and.stub();
    spyOn(compareVersionsService, 'getDiffGraphData').and.returnValue(
      Promise.resolve(null)
    );

    component.selectedVersionsArray = [1, 4];
    component.compareVersionMetadata = {};
    component.totalExplorationVersionMetadata = [
      {
        committerId: '1',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 1',
        versionNumber: 1,
      },
      {
        committerId: '2',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 2',
        versionNumber: 2,
      },
      {
        committerId: '3',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 3',
        versionNumber: 3,
      },
      {
        committerId: '4',
        createdOnMsecsStr: 10,
        commitMessage: 'commit message 4',
        versionNumber: 4,
      },
    ];
    component.changeCompareVersion();
    tick();
    expect(component.compareVersionMetadata.earlierVersion).toEqual(
      component.totalExplorationVersionMetadata[0]
    );
    expect(component.compareVersionMetadata.laterVersion).toEqual(
      component.totalExplorationVersionMetadata[3]
    );

    component.selectedVersionsArray = [2, 4];

    component.changeCompareVersion();
    tick();
    expect(component.compareVersionMetadata.earlierVersion).toEqual(
      component.totalExplorationVersionMetadata[1]
    );
    expect(component.compareVersionMetadata.laterVersion).toEqual(
      component.totalExplorationVersionMetadata[3]
    );

    component.selectedVersionsArray = [2, 3];

    component.changeCompareVersion();
    tick();
    expect(component.compareVersionMetadata.earlierVersion).toEqual(
      component.totalExplorationVersionMetadata[1]
    );
    expect(component.compareVersionMetadata.laterVersion).toEqual(
      component.totalExplorationVersionMetadata[2]
    );
  }));
});
