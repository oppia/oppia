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
 * @fileoverview Unit tests for AutogeneratedAudioLanguage model.
 */

import {AutogeneratedAudioLanguage} from 'domain/utilities/autogenerated-audio-language.model';

describe('AutogeneratedAudioLanguage model', () => {
  let autogenAudioLanguage: AutogeneratedAudioLanguage;
  beforeEach(() => {
    autogenAudioLanguage = AutogeneratedAudioLanguage.createFromDict({
      id: 'a',
      description: 'a description',
      explorationLanguage: 'English',
      speechSynthesisCode: '1',
      speechSynthesisCodeMobile: '2',
    });
  });

  it('should set attributes correctly', () => {
    expect(autogenAudioLanguage.id).toEqual('a');
    expect(autogenAudioLanguage.description).toEqual('a description');
    expect(autogenAudioLanguage.explorationLanguage).toEqual('English');
    expect(autogenAudioLanguage.speechSynthesisCode).toEqual('1');
    expect(autogenAudioLanguage.speechSynthesisCodeMobile).toEqual('2');
  });
});
