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
 * @fileoverview Unit tests for exploration metadata object factory.
 */

import { TestBed } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { ExplorationMetadata, ExplorationMetadataBackendDict, ExplorationMetadataObjectFactory } from './ExplorationMetadataObjectFactory';

describe('Exploration metadata object factory', () => {
  let explorationMetadataObjectFactory: ExplorationMetadataObjectFactory;
  let explorationMetadata: ExplorationMetadata;
  let explorationMetadataBackendDict: ExplorationMetadataBackendDict;
  const cArgs = {
    parse_with_jinja: true,
    value: ''
  };
  const gId = 'Copier';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExplorationMetadataObjectFactory]
    });

    explorationMetadataObjectFactory = TestBed.inject(
      ExplorationMetadataObjectFactory);

    explorationMetadataBackendDict = {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_changes: [{
        customization_args: cArgs,
        generator_id: gId,
        name: 'param_1'
      }],
      param_specs: {},
      auto_tts_enabled: false,
      edits_allowed: true
    };
  });

  it('should create exploration metadata object from backend dict', () => {
    explorationMetadata = explorationMetadataObjectFactory
      .createFromBackendDict(explorationMetadataBackendDict);

    expect(explorationMetadata.toBackendDict()).toEqual(
      explorationMetadataBackendDict);
  });

  it('should contain all the latest exploration metadata properties', () => {
    // This test is meant to fail when the properties mentioned in
    // constants.METADATA_PROPERTIES are not present in the model class.
    // If you modify anything in constants.METADATA_PROPERTIES, then make
    // sure to include the changes in properties in the attributes of the
    // model class too.
    explorationMetadata = explorationMetadataObjectFactory
      .createFromBackendDict(explorationMetadataBackendDict);
    const backendDict = explorationMetadata.toBackendDict();

    for (let property of AppConstants.METADATA_PROPERTIES) {
      expect(backendDict.hasOwnProperty(property)).toBeTrue();
    }
    for (let property of AppConstants.NON_METADATA_PROPERTIES) {
      expect(backendDict.hasOwnProperty(property)).toBeFalse();
    }
  });
});
