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
 * @fileoverview Unit tests for ExplorationMetadataDiffModalComponent.
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HistoryTabYamlConversionService} from '../services/history-tab-yaml-conversion.service';
import {ExplorationMetadataDiffModalComponent} from './exploration-metadata-diff-modal.component';
import {
  ExplorationMetadata,
  ExplorationMetadataBackendDict,
  ExplorationMetadataObjectFactory,
} from 'domain/exploration/ExplorationMetadataObjectFactory';

describe('Exploration Metadata Diff Modal Component', () => {
  let explorationMetadataObjectFactory: ExplorationMetadataObjectFactory;
  let component: ExplorationMetadataDiffModalComponent;
  let fixture: ComponentFixture<ExplorationMetadataDiffModalComponent>;
  let historyTabYamlConversionService: HistoryTabYamlConversionService;
  let newExplorationMetadataBackendDict: ExplorationMetadataBackendDict;
  let oldExplorationMetadataBackendDict: ExplorationMetadataBackendDict;

  let headers = {
    leftPane: 'header 1',
    rightPane: 'header 2',
  };
  let newMetadata: ExplorationMetadata | null;
  let oldMetadata: ExplorationMetadata | null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ExplorationMetadataDiffModalComponent],
      providers: [NgbActiveModal, HistoryTabYamlConversionService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationMetadataDiffModalComponent);
    component = fixture.componentInstance;
    explorationMetadataObjectFactory = TestBed.inject(
      ExplorationMetadataObjectFactory
    );
    historyTabYamlConversionService = TestBed.inject(
      HistoryTabYamlConversionService
    );
  });

  beforeEach(() => {
    oldExplorationMetadataBackendDict = {
      title: '',
      category: '',
      objective: '',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    };
    newExplorationMetadataBackendDict = {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    };

    newMetadata = explorationMetadataObjectFactory.createFromBackendDict(
      newExplorationMetadataBackendDict
    );
    oldMetadata = explorationMetadataObjectFactory.createFromBackendDict(
      oldExplorationMetadataBackendDict
    );

    component.headers = headers;
    component.newMetadata = newMetadata;
    component.oldMetadata = oldMetadata;
  });

  it('should evaluate YAML strings object', fakeAsync(() => {
    spyOn(
      historyTabYamlConversionService,
      'getYamlStringFromStateOrMetadata'
    ).and.resolveTo('YAML data');

    expect(component.yamlStrs.leftPane).toBe('');
    expect(component.yamlStrs.rightPane).toBe('');

    component.ngOnInit();
    tick(201);

    expect(component.yamlStrs.leftPane).toBe('YAML data');
    expect(component.yamlStrs.rightPane).toBe('YAML data');
  }));
});
