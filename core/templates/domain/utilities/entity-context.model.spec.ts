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
 * @fileoverview Unit tests for EntityContext model.
 */

import {EntityContext} from 'domain/utilities/entity-context.model';

describe('Entity context model', () => {
  describe('EntityContext', () => {
    it('should create a new entity context object', () => {
      var entityContext = new EntityContext('entity_id', 'entity_type');
      expect(entityContext.getId()).toEqual('entity_id');
      expect(entityContext.getType()).toEqual('entity_type');
    });
  });
});
