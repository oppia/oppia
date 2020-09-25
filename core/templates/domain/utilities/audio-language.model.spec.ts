// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AudioLanguage model.
 */

import { AudioLanguage } from 'domain/utilities/audio-language.model';

describe('AudioLanguage model', () => {
  let audioLanguage: AudioLanguage;
  beforeEach(() => {
    audioLanguage = AudioLanguage.createFromDict({
      id: 'a',
      description: 'a description',
      relatedLanguages: ['English'],
    });
  });

  it('should set attributes correctly', () => {
    expect(audioLanguage.id).toEqual('a');
    expect(audioLanguage.description).toEqual('a description');
    expect(audioLanguage.relatedLanguages).toEqual(['English']);
  });
});
