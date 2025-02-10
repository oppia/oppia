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
 * @fileoverview Unit tests for state version history modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ContextService} from 'services/context.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {HistoryTabYamlConversionService} from '../services/history-tab-yaml-conversion.service';
import {VersionHistoryBackendApiService} from '../services/version-history-backend-api.service';
import {
  StateDiffData,
  VersionHistoryService,
} from '../services/version-history.service';
import {StateVersionHistoryModalComponent} from './state-version-history-modal.component';
import {
  StateBackendDict,
  StateObjectFactory,
} from 'domain/state/StateObjectFactory';

describe('State version history modal', () => {
  let component: StateVersionHistoryModalComponent;
  let fixture: ComponentFixture<StateVersionHistoryModalComponent>;
  let stateObjectFactory: StateObjectFactory;
  let historyTabYamlConversionService: HistoryTabYamlConversionService;
  let versionHistoryService: VersionHistoryService;
  let versionHistoryBackendApiService: VersionHistoryBackendApiService;
  let contextService: ContextService;
  let stateObject: StateBackendDict;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateVersionHistoryModalComponent],
      providers: [
        NgbActiveModal,
        ContextService,
        VersionHistoryService,
        VersionHistoryBackendApiService,
        HistoryTabYamlConversionService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateVersionHistoryModalComponent);
    component = fixture.componentInstance;
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    historyTabYamlConversionService = TestBed.inject(
      HistoryTabYamlConversionService
    );
    versionHistoryService = TestBed.inject(VersionHistoryService);
    versionHistoryBackendApiService = TestBed.inject(
      VersionHistoryBackendApiService
    );
    contextService = TestBed.inject(ContextService);

    stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
    };
  });

  it('should get whether we can explore backward version history', () => {
    spyOn(
      versionHistoryService,
      'canShowBackwardStateDiffData'
    ).and.returnValue(true);

    expect(component.canExploreBackwardVersionHistory()).toBeTrue();
  });

  it('should get whether we can explore forward version history', () => {
    spyOn(versionHistoryService, 'canShowForwardStateDiffData').and.returnValue(
      true
    );

    expect(component.canExploreForwardVersionHistory()).toBeTrue();
  });

  it('should get the last edited version number', () => {
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: '',
    });

    expect(component.getLastEditedVersionNumber()).toEqual(2);
  });

  it('should throw error when last edited version number is null', () => {
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldVersionNumber: null,
    } as StateDiffData);

    expect(() => component.getLastEditedVersionNumber()).toThrowError(
      'Last edited version number cannot be null'
    );
  });

  it('should get the last edited committer username', () => {
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some',
    });

    expect(component.getLastEditedCommitterUsername()).toEqual('some');
  });

  it('should get the next edited version number', () => {
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(versionHistoryService, 'getForwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 3,
      newVersionNumber: 2,
      committerUsername: 'some',
    });

    expect(component.getNextEditedVersionNumber()).toEqual(3);
  });

  it('should throw error when next edited version number is null', () => {
    spyOn(versionHistoryService, 'getForwardStateDiffData').and.returnValue({
      oldVersionNumber: null,
    } as StateDiffData);

    expect(() => component.getNextEditedVersionNumber()).toThrowError(
      'Next edited version number cannot be null'
    );
  });

  it('should get the next edited committer username', () => {
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(versionHistoryService, 'getForwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 3,
      newVersionNumber: 2,
      committerUsername: 'some',
    });

    expect(component.getNextEditedCommitterUsername()).toEqual('some');
  });

  it(
    'should update the left and the right side yaml strings on exploring' +
      ' forward version history',
    fakeAsync(() => {
      const stateData = stateObjectFactory.createFromBackendDict(
        'State',
        stateObject
      );
      spyOn(versionHistoryService, 'getForwardStateDiffData').and.returnValue({
        oldState: stateData,
        newState: stateData,
        oldVersionNumber: 3,
        newVersionNumber: 2,
        committerUsername: 'some',
      });
      spyOn(
        historyTabYamlConversionService,
        'getYamlStringFromStateOrMetadata'
      ).and.resolveTo('YAML STRING');

      expect(component.yamlStrs.previousVersionStateYaml).toEqual('');
      expect(component.yamlStrs.currentVersionStateYaml).toEqual('');

      component.onClickExploreForwardVersionHistory();
      tick();

      expect(component.yamlStrs.previousVersionStateYaml).toEqual(
        'YAML STRING'
      );
      expect(component.yamlStrs.currentVersionStateYaml).toEqual('YAML STRING');
    })
  );

  it(
    'should throw error on exploring forward version history when state' +
      ' names from version history data are not defined',
    () => {
      spyOn(versionHistoryService, 'getForwardStateDiffData').and.returnValues(
        {
          oldState: stateObjectFactory.createFromBackendDict(
            'State',
            stateObject
          ),
          newState: stateObjectFactory.createFromBackendDict(null, stateObject),
          oldVersionNumber: 3,
        } as StateDiffData,
        {
          oldState: stateObjectFactory.createFromBackendDict(null, stateObject),
          newState: stateObjectFactory.createFromBackendDict(
            'State',
            stateObject
          ),
          oldVersionNumber: 3,
        } as StateDiffData
      );

      expect(() =>
        component.onClickExploreForwardVersionHistory()
      ).toThrowError('State name cannot be null');
      expect(() =>
        component.onClickExploreForwardVersionHistory()
      ).toThrowError('State name cannot be null');
    }
  );

  it(
    'should update the left and the right side yaml strings on exploring' +
      ' backward version history',
    fakeAsync(() => {
      const stateData = stateObjectFactory.createFromBackendDict(
        'State',
        stateObject
      );
      spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
        oldState: stateData,
        newState: stateData,
        oldVersionNumber: 2,
        newVersionNumber: 3,
        committerUsername: 'some',
      });
      spyOn(
        historyTabYamlConversionService,
        'getYamlStringFromStateOrMetadata'
      ).and.resolveTo('YAML STRING');
      spyOn(component, 'fetchPreviousVersionHistory').and.callFake(() => {});

      expect(component.yamlStrs.previousVersionStateYaml).toEqual('');
      expect(component.yamlStrs.currentVersionStateYaml).toEqual('');

      component.onClickExploreBackwardVersionHistory();
      tick();

      expect(component.yamlStrs.previousVersionStateYaml).toEqual(
        'YAML STRING'
      );
      expect(component.yamlStrs.currentVersionStateYaml).toEqual('YAML STRING');
    })
  );

  it(
    'should throw error on exploring backward version history when state' +
      ' names from version history data are not defined',
    () => {
      spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValues(
        {
          oldState: stateObjectFactory.createFromBackendDict(
            'State',
            stateObject
          ),
          newState: stateObjectFactory.createFromBackendDict(null, stateObject),
          oldVersionNumber: 3,
        } as StateDiffData,
        {
          oldState: stateObjectFactory.createFromBackendDict(null, stateObject),
          newState: stateObjectFactory.createFromBackendDict(
            'State',
            stateObject
          ),
          oldVersionNumber: 3,
        } as StateDiffData
      );

      expect(() =>
        component.onClickExploreBackwardVersionHistory()
      ).toThrowError('State name cannot be null');
      expect(() =>
        component.onClickExploreBackwardVersionHistory()
      ).toThrowError('State name cannot be null');
    }
  );

  it('should be able to fetch the backward version history', fakeAsync(() => {
    spyOn(
      versionHistoryService,
      'shouldFetchNewStateVersionHistory'
    ).and.returnValues(false, true);
    spyOn(
      versionHistoryService,
      'insertStateVersionHistoryData'
    ).and.callThrough();
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some',
    });
    spyOn(
      versionHistoryBackendApiService,
      'fetchStateVersionHistoryAsync'
    ).and.resolveTo({
      lastEditedVersionNumber: 3,
      stateNameInPreviousVersion: 'State',
      stateInPreviousVersion: stateData,
      lastEditedCommitterUsername: '',
    });
    versionHistoryService.setCurrentPositionInStateVersionHistoryList(0);

    component.fetchPreviousVersionHistory();

    expect(
      versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ).toEqual(1);

    versionHistoryService.setCurrentPositionInStateVersionHistoryList(0);
    component.fetchPreviousVersionHistory();
    tick();

    expect(
      versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ).toEqual(1);
  }));

  it(
    'should throw error while fetching previous version history data if the ' +
      'state data for previous version is not available',
    () => {
      spyOn(
        versionHistoryService,
        'shouldFetchNewStateVersionHistory'
      ).and.returnValue(true);
      const stateData = stateObjectFactory.createFromBackendDict(
        null,
        stateObject
      );
      spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValues(
        {
          oldState: null,
          newState: null,
          oldVersionNumber: 2,
          newVersionNumber: 3,
          committerUsername: 'some',
        },
        {
          oldState: stateData,
          newState: stateData,
          oldVersionNumber: 2,
          newVersionNumber: 3,
          committerUsername: 'some',
        }
      );

      expect(() => component.fetchPreviousVersionHistory()).toThrowError(
        'The state data for the previous version is not available.'
      );
      expect(() => component.fetchPreviousVersionHistory()).toThrowError(
        'The name of the state in the previous version was not specified.'
      );
    }
  );

  it('should be show error message if the backend api fails', fakeAsync(() => {
    spyOn(
      versionHistoryService,
      'shouldFetchNewStateVersionHistory'
    ).and.returnValue(true);
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some',
    });
    spyOn(
      versionHistoryBackendApiService,
      'fetchStateVersionHistoryAsync'
    ).and.resolveTo(null);

    expect(component.validationErrorIsShown).toBeFalse();

    component.fetchPreviousVersionHistory();
    tick();

    expect(component.validationErrorIsShown).toBeTrue();
  }));

  it('should update the left and right side yaml strings on initialization', fakeAsync(() => {
    spyOn(
      historyTabYamlConversionService,
      'getYamlStringFromStateOrMetadata'
    ).and.resolveTo('YAML STRING');
    spyOn(component, 'fetchPreviousVersionHistory').and.callFake(() => {});

    component.ngOnInit();
    tick();

    expect(component.yamlStrs.previousVersionStateYaml).toEqual('YAML STRING');
    expect(component.yamlStrs.currentVersionStateYaml).toEqual('YAML STRING');
    expect(component.fetchPreviousVersionHistory).toHaveBeenCalled();
  }));

  it('should get the last edited version number in case of error', () => {
    versionHistoryService.insertStateVersionHistoryData(4, null, '');

    expect(component.getLastEditedVersionNumberInCaseOfError()).toEqual(4);
  });
});
