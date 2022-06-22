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
 * @fileoverview Unit tests for history tab yaml conversion service.
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { State, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { YamlService } from 'services/yaml.service';
import { HistoryTabYamlConversionService } from './history-tab-yaml-conversion.service';

describe('History tab yaml conversion service', () => {
  let historyTabYamlConversionService: HistoryTabYamlConversionService;
  let yamlService: YamlService;
  let stateObjectFactory: StateObjectFactory;
  let testState: State;
  let testStateYamlString: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [YamlService]
    });

    historyTabYamlConversionService = TestBed.inject(
      HistoryTabYamlConversionService);
    yamlService = TestBed.inject(YamlService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);

    testState = stateObjectFactory.createDefaultState('state_1');
    testStateYamlString = yamlService.stringify(testState.toBackendDict());
  });

  it('should get the yaml representation of the given entity when it is truthy',
    fakeAsync(() => {
      historyTabYamlConversionService
        .getYamlStringFromStateOrMetadata(testState)
        .then((result) => {
          expect(result).toEqual(testStateYamlString);
        });
      tick(201);
    }));

  it('should return an empty string when the given entity is falsy',
    fakeAsync(() => {
      historyTabYamlConversionService
        .getYamlStringFromStateOrMetadata(null)
        .then((result) => {
          expect(result).toEqual('');
        });
      tick(201);
    }));
});
