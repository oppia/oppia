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
 * @fileoverview Unit tests for state version history component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { VersionHistoryBackendApiService } from 'pages/exploration-editor-page/services/version-history-backend-api.service';
import { StateDiffData, VersionHistoryService } from 'pages/exploration-editor-page/services/version-history.service';
import { StateVersionHistoryComponent } from './state-version-history.component';

describe('State version history component', () => {
  let component: StateVersionHistoryComponent;
  let fixture: ComponentFixture<StateVersionHistoryComponent>;
  let stateObjectFactory: StateObjectFactory;
  let versionHistoryService: VersionHistoryService;
  let stateObject: StateBackendDict;
  let ngbModal: NgbModal;
  let versionHistoryBackendApiService: VersionHistoryBackendApiService;

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateVersionHistoryComponent],
      providers: [
        VersionHistoryBackendApiService,
        VersionHistoryService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateVersionHistoryComponent);
    component = fixture.componentInstance;
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    versionHistoryBackendApiService = TestBed.inject(
      VersionHistoryBackendApiService);
    versionHistoryService = TestBed.inject(VersionHistoryService);
    ngbModal = TestBed.inject(NgbModal);

    stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: ''
            }
          }
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        solution: null,
        id: 'TextInput'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false
    };
    let stateData = stateObjectFactory.createFromBackendDict(
      'State', stateObject);
    spyOn(
      versionHistoryBackendApiService, 'fetchStateVersionHistoryAsync'
    ).and.resolveTo({
      lastEditedVersionNumber: 2,
      stateNameInPreviousVersion: 'State',
      stateInPreviousVersion: stateData,
      lastEditedCommitterUsername: 'some'
    });
  });

  it('should get the last edited version number for the active state', () => {
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldVersionNumber: 3
    } as StateDiffData);

    expect(component.getLastEditedVersionNumber()).toEqual(3);
  });

  it('should get the last edited committer username for the active state',
    () => {
      spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
        committerUsername: 'some'
      } as StateDiffData);

      expect(component.getLastEditedCommitterUsername()).toEqual('some');
    });

  it('should throw error when last edited version number is null', () => {
    spyOn(
      versionHistoryService, 'getBackwardStateDiffData'
    ).and.returnValue({
      oldVersionNumber: null
    } as StateDiffData);

    expect(
      () =>component.getLastEditedVersionNumber()
    ).toThrowError('The value of last edited version number cannot be null');
  });

  it('should get whether version history can be explored', () => {
    spyOn(
      versionHistoryService, 'canShowBackwardStateDiffData'
    ).and.returnValue(true);

    expect(component.canShowExploreVersionHistoryButton()).toBeTrue();
  });

  it('should open the state version history modal on clicking the explore ' +
  'version history button', () => {
    class MockComponentInstance {
      componentInstance = {
        newState: null,
        newStateName: 'A',
        oldState: null,
        oldStateName: 'B',
        headers: {
          leftPane: '',
          rightPane: '',
        }
      };
    }
    spyOn(ngbModal, 'open').and.returnValues({
      componentInstance: MockComponentInstance,
      result: Promise.resolve()
    } as NgbModalRef, {
      componentInstance: MockComponentInstance,
      result: Promise.reject()
    } as NgbModalRef);
    let stateData = stateObjectFactory
      .createFromBackendDict('State', stateObject);
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValue({
      oldState: stateData,
      newState: stateData,
      oldVersionNumber: 3
    } as StateDiffData);

    component.onClickExploreVersionHistoryButton();

    expect(ngbModal.open).toHaveBeenCalled();

    component.onClickExploreVersionHistoryButton();
  });

  it('should throw error on exploring version history when state' +
  ' names from version history data are not defined', () => {
    class MockComponentInstance {
      componentInstance = {
        newState: null,
        newStateName: 'A',
        oldState: null,
        oldStateName: 'B',
        headers: {
          leftPane: '',
          rightPane: '',
        }
      };
    }
    spyOn(versionHistoryService, 'getBackwardStateDiffData').and.returnValues({
      oldState: stateObjectFactory.createFromBackendDict(
        null, stateObject),
      newState: stateObjectFactory.createFromBackendDict(
        null, stateObject),
      oldVersionNumber: 3
    } as StateDiffData, {
      oldState: stateObjectFactory.createFromBackendDict(
        null, stateObject),
      newState: stateObjectFactory.createFromBackendDict(
        'State', stateObject),
      oldVersionNumber: 3
    } as StateDiffData);
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockComponentInstance,
      result: Promise.resolve()
    } as NgbModalRef);

    expect(
      () => component.onClickExploreVersionHistoryButton()
    ).toThrowError('State name cannot be null');
    expect(
      () => component.onClickExploreVersionHistoryButton()
    ).toThrowError('State name cannot be null');
  });
});
