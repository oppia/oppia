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
 * @fileoverview Unit test for Exploration Tags Service
 */

require('pages/exploration-editor-page/services/exploration-tags.service.ts');

describe ('Exploration Tag Service', () =>{
  beforeEach(angular.mock.module('oppia'));
  var component=null;
  beforeEach(angular.mock.inject(function($injector){
    component=$injector.get('ExplorationTagsService');
  }))
  it('value does not match TAG_REGEX', () =>{
    let value=["alice","bob","cat"];
    let TAG_REGEX=["alice","bob","dory"];
    expect(component.child._isvalid).toBe(false);
  })
  it('all tags in value match TAG_REGEX', () =>{
    let value=["alice","bob","cat"];
    let TAG_REGEX=["alice","bob","cat"];
    expect(component.child._isvalid).toBe(true)
  })

  it('tags normalised', () =>{
    let value=["  alice  bob ","cat  ","  dolly naa"];
    const result=component.child._normalise;
    expect(result).toContain('alice  bob');
    expect(result).toContain('cat');
    expect(result).toContain('dolly naa');
  })
})
