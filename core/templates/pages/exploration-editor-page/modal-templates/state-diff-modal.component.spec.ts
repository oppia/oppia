// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StateDiffModalComponent.
 */

import {State, StateObjectFactory} from 'domain/state/StateObjectFactory';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  headersAndYamlStrs,
  StateDiffModalComponent,
} from './state-diff-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HistoryTabYamlConversionService} from '../services/history-tab-yaml-conversion.service';

describe('State Diff Modal Component', () => {
  let stateObjectFactory: StateObjectFactory;
  let component: StateDiffModalComponent;
  let fixture: ComponentFixture<StateDiffModalComponent>;
  let historyTabYamlConversionService: HistoryTabYamlConversionService;

  let headers: headersAndYamlStrs;
  let newState: State | null;
  let newStateName = 'New state';
  let oldState: State | null;
  let oldStateName = 'Old state';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateDiffModalComponent],
      providers: [NgbActiveModal, HistoryTabYamlConversionService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateDiffModalComponent);
    component = fixture.componentInstance;
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    historyTabYamlConversionService = TestBed.inject(
      HistoryTabYamlConversionService
    );
  });

  beforeEach(() => {
    newState = stateObjectFactory.createDefaultState(
      newStateName,
      'content_0',
      'default_outcome_1'
    );
    oldState = stateObjectFactory.createDefaultState(
      oldStateName,
      'content_0',
      'default_outcome_1'
    );

    component.headers = headers;
    component.newState = newState;
    component.newStateName = newStateName;
    component.oldState = oldState;
    component.oldStateName = oldStateName;
  });

  it('should initialize component properties after component is initialized', fakeAsync(() => {
    spyOn(
      historyTabYamlConversionService,
      'getYamlStringFromStateOrMetadata'
    ).and.resolveTo('YAML data');

    component.ngOnInit();
    tick(201);

    fixture.whenStable().then(() => {
      expect(component.headers).toBe(headers);
      expect(component.newStateName).toBe(newStateName);
      expect(component.oldStateName).toBe(oldStateName);
    });
  }));

  it('should evaluate YAML strings object', fakeAsync(() => {
    spyOn(
      historyTabYamlConversionService,
      'getYamlStringFromStateOrMetadata'
    ).and.resolveTo('YAML data');

    component.ngOnInit();
    tick(201);

    fixture.whenStable().then(() => {
      expect(component.yamlStrs.leftPane).toBe('YAML data');
      expect(component.yamlStrs.rightPane).toBe('YAML data');
    });
  }));

  it('should evaluate YAML string objects for translation changes', fakeAsync(() => {
    spyOn(
      historyTabYamlConversionService,
      'getYamlStringFromTranslations'
    ).and.resolveTo('YAML data');

    component.showingTranslationChanges = true;
    component.ngOnInit();
    tick();

    fixture.whenStable().then(() => {
      expect(component.yamlStrs.leftPane).toBe('YAML data');
      expect(component.yamlStrs.rightPane).toBe('YAML data');
    });
  }));
});
