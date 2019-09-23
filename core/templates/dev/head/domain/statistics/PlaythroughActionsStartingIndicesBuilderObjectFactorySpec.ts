// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the
 * PlaythroughActionsStartingIndicesBuilderObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { PlaythroughActionsStartingIndicesBuilderObjectFactory } from
  'domain/statistics/PlaythroughActionsStartingIndicesBuilderObjectFactory';

fdescribe('Grouped Starting Indices Object Factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlaythroughActionsStartingIndicesBuilderObjectFactory]
    });

    this.pasiof = TestBed.get(
      PlaythroughActionsStartingIndicesBuilderObjectFactory);
    this.action1 = {
      actionCustomizationArgs: {
        state_name: {
          value: 'stateName1'
        }
      }
    };
    this.action2 = {
      actionCustomizationArgs: {
        state_name: {
          value: 'stateName2'
        }
      }
    };
    this.action3 = {
      actionCustomizationArgs: {
        state_name: {
          value: 'stateName3'
        }
      }
    };
  });

  it('should create a grouped starting indices instance.', () => {
    var startingIndices = this.pasiof.createNew(
      3, 'stateName1');

    expect(startingIndices.startingIndices).toEqual([]);
    expect(startingIndices.latestStateName).toEqual('stateName1');
    expect(startingIndices.lastIndex).toEqual(3);
    expect(startingIndices.localIndex).toEqual(3);
  });

  it('should update local index when same state is handled.', () => {
    var startingIndices = this.pasiof.createNew(
      3, 'stateName1');
    startingIndices.handleSameState();
    expect(startingIndices.localIndex).toEqual(2);
  });

  it('should handle state changes correctly.', () => {
    var startingIndices = this.pasiof.createNew(
      7, 'stateName1');

    startingIndices.handleChangeInState(this.action2);
    expect(startingIndices.localIndex).toEqual(6);

    startingIndices.handleChangeInState(this.action1);
    expect(startingIndices.localIndex).toEqual(5);

    startingIndices.handleChangeInState(this.action2);
    expect(startingIndices.localIndex).toEqual(4);

    startingIndices.handleChangeInState(this.action1);
    expect(startingIndices.localIndex).toEqual(3);

    startingIndices.handleChangeInState(this.action2);
    expect(startingIndices.localIndex).toEqual(2);
    expect(startingIndices.startingIndices).toEqual([3]);
  });
});
