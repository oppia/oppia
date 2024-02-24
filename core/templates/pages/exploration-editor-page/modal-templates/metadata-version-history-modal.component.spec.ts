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
 * @fileoverview Unit tests for metadata version history modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'services/context.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HistoryTabYamlConversionService } from '../services/history-tab-yaml-conversion.service';
import { VersionHistoryBackendApiService } from '../services/version-history-backend-api.service';
import { MetadataDiffData, VersionHistoryService } from '../services/version-history.service';
import { MetadataVersionHistoryModalComponent } from './metadata-version-history-modal.component';
import { ExplorationMetadata } from 'domain/exploration/ExplorationMetadataObjectFactory';
import { ParamSpecs } from 'domain/exploration/ParamSpecsObjectFactory';
import { ParamSpecObjectFactory } from 'domain/exploration/ParamSpecObjectFactory';

describe('Metadata version history modal', () => {
  let component: MetadataVersionHistoryModalComponent;
  let fixture: ComponentFixture<MetadataVersionHistoryModalComponent>;
  let historyTabYamlConversionService: HistoryTabYamlConversionService;
  let versionHistoryService: VersionHistoryService;
  let versionHistoryBackendApiService: VersionHistoryBackendApiService;
  let contextService: ContextService;
  let explorationMetadata: ExplorationMetadata;
  let paramSpecObjectFactory: ParamSpecObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [MetadataVersionHistoryModalComponent],
      providers: [
        NgbActiveModal,
        ContextService,
        VersionHistoryService,
        VersionHistoryBackendApiService,
        HistoryTabYamlConversionService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataVersionHistoryModalComponent);
    component = fixture.componentInstance;
    historyTabYamlConversionService = TestBed.inject(
      HistoryTabYamlConversionService);
    versionHistoryService = TestBed.inject(VersionHistoryService);
    versionHistoryBackendApiService = TestBed.inject(
      VersionHistoryBackendApiService
    );
    contextService = TestBed.inject(ContextService);
    paramSpecObjectFactory = TestBed.inject(ParamSpecObjectFactory);

    explorationMetadata = new ExplorationMetadata(
      'title', 'category', 'objective', 'en',
      [], '', '', 55, 'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory), [], false, true
    );
  });

  it('should get whether we can explore backward version history', () => {
    spyOn(
      versionHistoryService, 'canShowBackwardMetadataDiffData'
    ).and.returnValue(true);

    expect(component.canExploreBackwardVersionHistory()).toBeTrue();
  });

  it('should get whether we can explore forward version history', () => {
    spyOn(
      versionHistoryService, 'canShowForwardMetadataDiffData'
    ).and.returnValue(true);

    expect(component.canExploreForwardVersionHistory()).toBeTrue();
  });

  it('should get the last edited version number', () => {
    spyOn(
      versionHistoryService, 'getBackwardMetadataDiffData'
    ).and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: ''
    });

    expect(component.getLastEditedVersionNumber()).toEqual(2);
  });

  it('should throw error when last edited version number is null', () => {
    spyOn(
      versionHistoryService, 'getBackwardMetadataDiffData'
    ).and.returnValue({
      oldVersionNumber: null
    } as MetadataDiffData);

    expect(
      () =>component.getLastEditedVersionNumber()
    ).toThrowError('Last edited version number cannot be null');
  });

  it('should get the last edited committer username', () => {
    spyOn(
      versionHistoryService, 'getBackwardMetadataDiffData'
    ).and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some'
    });

    expect(component.getLastEditedCommitterUsername()).toEqual('some');
  });

  it('should get the next edited version number', () => {
    spyOn(versionHistoryService, 'getForwardMetadataDiffData').and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 3,
      newVersionNumber: 2,
      committerUsername: 'some'
    });

    expect(component.getNextEditedVersionNumber()).toEqual(3);
  });

  it('should throw error when next edited version number is null', () => {
    spyOn(
      versionHistoryService, 'getForwardMetadataDiffData'
    ).and.returnValue({
      oldVersionNumber: null
    } as MetadataDiffData);

    expect(
      () =>component.getNextEditedVersionNumber()
    ).toThrowError('Next edited version number cannot be null');
  });

  it('should get the next edited committer username', () => {
    spyOn(versionHistoryService, 'getForwardMetadataDiffData').and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 3,
      newVersionNumber: 2,
      committerUsername: 'some'
    });

    expect(component.getNextEditedCommitterUsername()).toEqual('some');
  });

  it('should update the left and the right side yaml strings on exploring' +
  ' forward version history', fakeAsync(() => {
    spyOn(versionHistoryService, 'getForwardMetadataDiffData').and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 3,
      newVersionNumber: 2,
      committerUsername: 'some'
    });
    spyOn(
      historyTabYamlConversionService, 'getYamlStringFromStateOrMetadata'
    ).and.resolveTo('YAML STRING');

    expect(component.yamlStrs.previousVersionMetadataYaml).toEqual('');
    expect(component.yamlStrs.currentVersionMetadataYaml).toEqual('');

    component.onClickExploreForwardVersionHistory();
    tick();

    expect(
      component.yamlStrs.previousVersionMetadataYaml
    ).toEqual('YAML STRING');
    expect(
      component.yamlStrs.currentVersionMetadataYaml
    ).toEqual('YAML STRING');
  }));

  it('should update the left and the right side yaml strings on exploring' +
  ' backward version history', fakeAsync(() => {
    spyOn(
      versionHistoryService, 'getBackwardMetadataDiffData'
    ).and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some'
    });
    spyOn(
      historyTabYamlConversionService, 'getYamlStringFromStateOrMetadata'
    ).and.resolveTo('YAML STRING');
    spyOn(component, 'fetchPreviousVersionHistory').and.callFake(() => {});

    expect(component.yamlStrs.previousVersionMetadataYaml).toEqual('');
    expect(component.yamlStrs.currentVersionMetadataYaml).toEqual('');

    component.onClickExploreBackwardVersionHistory();
    tick();

    expect(
      component.yamlStrs.previousVersionMetadataYaml
    ).toEqual('YAML STRING');
    expect(
      component.yamlStrs.currentVersionMetadataYaml
    ).toEqual('YAML STRING');
  }));

  it('should be able to fetch the backward version history', fakeAsync(() => {
    spyOn(
      versionHistoryService, 'shouldFetchNewMetadataVersionHistory'
    ).and.returnValues(false, true);
    spyOn(
      versionHistoryService, 'insertMetadataVersionHistoryData'
    ).and.callThrough();
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(
      versionHistoryService, 'getBackwardMetadataDiffData'
    ).and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some'
    });
    spyOn(
      versionHistoryBackendApiService, 'fetchMetadataVersionHistoryAsync'
    ).and.resolveTo({
      lastEditedVersionNumber: 3,
      lastEditedCommitterUsername: '',
      metadataInPreviousVersion: explorationMetadata
    });
    versionHistoryService.setCurrentPositionInMetadataVersionHistoryList(0);

    component.fetchPreviousVersionHistory();

    expect(
      versionHistoryService.getCurrentPositionInMetadataVersionHistoryList()
    ).toEqual(1);

    versionHistoryService.setCurrentPositionInMetadataVersionHistoryList(0);
    component.fetchPreviousVersionHistory();
    tick();

    expect(
      versionHistoryService.getCurrentPositionInMetadataVersionHistoryList()
    ).toEqual(1);
  }));

  it('should be show error message if the backend api fails', fakeAsync(() => {
    spyOn(
      versionHistoryService, 'shouldFetchNewMetadataVersionHistory'
    ).and.returnValue(true);
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_1');
    spyOn(
      versionHistoryService, 'getBackwardMetadataDiffData'
    ).and.returnValue({
      oldMetadata: explorationMetadata,
      newMetadata: explorationMetadata,
      oldVersionNumber: 2,
      newVersionNumber: 3,
      committerUsername: 'some'
    });
    spyOn(
      versionHistoryBackendApiService, 'fetchMetadataVersionHistoryAsync'
    ).and.resolveTo(null);

    expect(component.validationErrorIsShown).toBeFalse();

    component.fetchPreviousVersionHistory();
    tick();

    expect(component.validationErrorIsShown).toBeTrue();
  }));

  it('should update the left and right side yaml strings on initialization',
    fakeAsync(() => {
      spyOn(
        historyTabYamlConversionService, 'getYamlStringFromStateOrMetadata'
      ).and.resolveTo('YAML STRING');
      spyOn(component, 'fetchPreviousVersionHistory').and.callFake(() => {});

      component.ngOnInit();
      tick();

      expect(
        component.yamlStrs.previousVersionMetadataYaml
      ).toEqual('YAML STRING');
      expect(
        component.yamlStrs.currentVersionMetadataYaml
      ).toEqual('YAML STRING');
      expect(component.fetchPreviousVersionHistory).toHaveBeenCalled();
    }));

  it('should get the last edited version number in case of error', () => {
    versionHistoryService.insertMetadataVersionHistoryData(4, null, '');

    expect(component.getLastEditedVersionNumberInCaseOfError()).toEqual(4);
  });
});
