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
 * @fileoverview Unit test for the State name service.
 */

import { TestBed } from '@angular/core/testing';

import { StateNameService } from
  'components/state-editor/state-editor-properties-services/state-name.service';


describe('State name service', () => {
  let sns: StateNameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateNameService]
    });

    sns = TestBed.get(StateNameService);
  });

  it('should evaluate properties before the initialization', () =>{
    expect(sns.getStateNameSavedMemento()).toBeNull();
    expect(sns.isStateNameEditorShown()).toBeFalse();
  });

  it('should call set state functions after init', () => {
    spyOn(sns, 'setStateNameSavedMemento');
    spyOn(sns, 'setStateNameEditorVisibility');
    sns.init();
    expect(sns.setStateNameSavedMemento).toHaveBeenCalled();
    expect(sns.getStateNameSavedMemento()).toBeNull();
    expect(sns.setStateNameEditorVisibility).toHaveBeenCalled();
    expect(sns.isStateNameEditorShown()).toBe(false);
  });

  it('should return the correct value for the getter functions', () => {
    expect(sns.getStateNameSavedMemento()).toBeNull();
    expect(sns.isStateNameEditorShown()).toBe(false);
    sns.setStateNameSavedMemento('SomeValue');
    expect(sns.getStateNameSavedMemento()).toBe('SomeValue');
    expect(sns.getStateNameSavedMemento()).toBe('SomeValue');
    sns.setStateNameEditorVisibility(true);
    expect(sns.isStateNameEditorShown()).toBe(true);
    expect(sns.isStateNameEditorShown()).toBe(true);
  });
});
