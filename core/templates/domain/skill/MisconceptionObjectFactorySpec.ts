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
 * @fileoverview Unit tests for MisconceptionObjectFacfory.
 */

import {
  MisconceptionObjectFactory,
  MisconceptionBackendDict,
} from 'domain/skill/MisconceptionObjectFactory';

describe('Misconception object factory', () => {
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let misconceptionDict: MisconceptionBackendDict;

  beforeEach(() => {
    misconceptionObjectFactory = new MisconceptionObjectFactory();
    misconceptionDict = {
      id: 1,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };
  });

  it('should create a new misconception from dict', () => {
    const misconception =
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict);
    expect(misconception.getId()).toEqual(1);
    expect(misconception.getName()).toEqual('test name');
    expect(misconception.getNotes()).toEqual('test notes');
    expect(misconception.getFeedback()).toEqual('test feedback');
    expect(misconception.isMandatory()).toEqual(true);
  });

  it('should convert to a backend dictionary', () => {
    const misconception =
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict);
    expect(misconception.toBackendDict()).toEqual(misconceptionDict);
  });

  it('should create a new misconception', () => {
    const misconception = misconceptionObjectFactory.create(
      1,
      'test name',
      'test notes',
      'test feedback',
      true
    );
    expect(misconception.getId()).toEqual(1);
    expect(misconception.getName()).toEqual('test name');
    expect(misconception.getNotes()).toEqual('test notes');
    expect(misconception.getFeedback()).toEqual('test feedback');
    expect(misconception.isMandatory()).toEqual(true);
  });

  it('should change the name from misconception object', () => {
    const misconception =
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict);
    expect(misconception.getName()).toEqual('test name');

    misconception.setName('new name');

    expect(misconception.getName()).toEqual('new name');
  });

  it('should change the notes from misconception object', () => {
    const misconception =
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict);
    expect(misconception.getNotes()).toEqual('test notes');

    misconception.setNotes('new notes');

    expect(misconception.getNotes()).toEqual('new notes');
  });

  it('should change if a misconception object must be addressed', () => {
    const misconception =
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict);
    expect(misconception.isMandatory()).toEqual(true);

    misconception.setMustBeAddressed(false);

    expect(misconception.isMandatory()).toEqual(false);
  });

  it('should change the feedback from misconception object', () => {
    const misconception =
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict);
    expect(misconception.getFeedback()).toEqual('test feedback');

    misconception.setFeedback('new feedback');

    expect(misconception.getFeedback()).toEqual('new feedback');
  });
});
