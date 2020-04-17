// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ExplorationMetadataObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { ExplorationMetadataObjectFactory } from
  'domain/exploration/ExplorationMetadataObjectFactory';


describe('Exploration Metadata object factory', () => {
  let sampleExplorationMetadata = null;

  beforeEach(() => {
    let sampleExplorationMetadataBackendDict = {
      collection_node_metadata_list: [{
        id: '12',
        objective:
        'learn how to count permutations accurately and systematically',
        title: 'Protractor Test'
      }, {
        id: '4',
        objective:
        'learn how to count permutations accurately and systematically',
        title: 'Three Balls'
      }]
    };


    sampleExplorationMetadata = (
      ExplorationMetadataObjectFactory.
        createFromBackendDict(sampleExplorationMetadataBackendDict));
  });

  it('should be able to get all the values', function() {
    expect(sampleExplorationMetadata.getMetadataList()).toEqual([{
      id: '12',
      objective:
      'learn how to count permutations accurately and systematically',
      title: 'Protractor Test'
    }, {
      id: '4',
      objective:
      'learn how to count permutations accurately and systematically',
      title: 'Three Balls'
    }]
    );
  });
});
