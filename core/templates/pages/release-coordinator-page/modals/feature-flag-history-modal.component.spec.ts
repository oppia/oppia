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
 * @fileoverview Unit tests for the feature flag history modal component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {
  FeatureFlagBackendApiService,
  FeatureFlagChange,
} from 'domain/feature-flag/feature-flag-backend-api.service';
import {UserGroup} from 'domain/release_coordinator/user-group.model';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {FeatureFlagHistoryModalComponent} from './feature-flag-history-modal.component';

describe('FeatureFlagHistoryModalComponent', () => {
  let component: FeatureFlagHistoryModalComponent;
  let fixture: ComponentFixture<FeatureFlagHistoryModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let featureFlagBackendApiService: FeatureFlagBackendApiService;
  let dateTimeFormatService: DateTimeFormatService;

  const defaultConfig = {
    forceEnableForAllUsers: false,
    rolloutPercentage: 0,
    userGroupIds: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [FeatureFlagHistoryModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureFlagHistoryModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    featureFlagBackendApiService = TestBed.inject(FeatureFlagBackendApiService);
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    spyOn(dateTimeFormatService, 'getLocaleDateTimeHourString').and.returnValue(
      'Jan 1 10:00 AM'
    );

    component.featureFlagName = 'feature_a';
    component.userGroups = [new UserGroup('group_id_1', 'Beta testers', [])];
  });

  it('should build one row per change with only the changed fields', fakeAsync(() => {
    const changes: FeatureFlagChange[] = [
      {
        committerUsername: 'coordinator',
        oldConfig: defaultConfig,
        newConfig: {
          forceEnableForAllUsers: true,
          rolloutPercentage: 20,
          userGroupIds: ['group_id_1', 'deleted_group_id'],
        },
        createdOnMsecs: 1000,
      },
      {
        committerUsername: null,
        oldConfig: {...defaultConfig, forceEnableForAllUsers: true},
        newConfig: defaultConfig,
        createdOnMsecs: 500,
      },
    ];
    const fetchSpy = spyOn(
      featureFlagBackendApiService,
      'fetchFeatureFlagHistoryAsync'
    ).and.resolveTo(changes);

    component.ngOnInit();
    expect(component.historyIsLoading).toBeTrue();
    flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledWith('feature_a');
    expect(component.historyIsLoading).toBeFalse();
    expect(component.errorMessage).toEqual('');
    expect(component.historyRows).toEqual([
      {
        dateString: 'Jan 1 10:00 AM',
        committer: 'coordinator',
        fieldChanges: [
          {
            fieldName: 'Force-enable for all users',
            oldValue: 'No',
            newValue: 'Yes',
          },
          {
            fieldName: 'Rollout percentage',
            oldValue: '0%',
            newValue: '20%',
          },
          {
            fieldName: 'User groups',
            oldValue: 'None',
            newValue: 'Beta testers, deleted_group_id',
          },
        ],
      },
      {
        dateString: 'Jan 1 10:00 AM',
        committer: '(deleted user)',
        fieldChanges: [
          {
            fieldName: 'Force-enable for all users',
            oldValue: 'Yes',
            newValue: 'No',
          },
        ],
      },
    ]);
  }));

  it('should show no rows for a flag that was never changed', fakeAsync(() => {
    spyOn(
      featureFlagBackendApiService,
      'fetchFeatureFlagHistoryAsync'
    ).and.resolveTo([]);

    component.ngOnInit();
    flushMicrotasks();

    expect(component.historyIsLoading).toBeFalse();
    expect(component.historyRows).toEqual([]);
  }));

  it('should show an error message if the history fails to load', fakeAsync(() => {
    spyOn(
      featureFlagBackendApiService,
      'fetchFeatureFlagHistoryAsync'
    ).and.rejectWith(new Error('Error'));

    component.ngOnInit();
    flushMicrotasks();

    expect(component.historyIsLoading).toBeFalse();
    expect(component.errorMessage).toEqual(
      'Failed to load the history of this flag.'
    );
  }));

  it('should dismiss the modal when closed', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');

    component.close();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
