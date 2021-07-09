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
 * @fileoverview Tests for ExplorationMetadata model.
 */
import { ExplorationMetadata } from
  'domain/exploration/exploration-metadata.model';

describe('Exploration Metadata model', () => {
  let sampleExplorationMetadata: ExplorationMetadata;

  beforeEach(() => {
    let sampleExplorationMetadataBackendDict: ExplorationMetadata = {
      id: '12',
      objective:
        'learn how to count permutations accurately and systematically',
      title: 'Protractor Test'
    };


    sampleExplorationMetadata = ExplorationMetadata.
      createFromBackendDict(sampleExplorationMetadataBackendDict);
  });

  it('should be able to get all the values', function() {
    expect(sampleExplorationMetadata.id).toEqual('12');
    expect(sampleExplorationMetadata.objective).toEqual(
      'learn how to count permutations accurately and systematically');
    expect(sampleExplorationMetadata.title).toEqual('Protractor Test');
  });
});
