// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Versions Tree Service.
 */

import { IExplorationSnapshot, VersionTreeService } from
  'pages/exploration-editor-page/history-tab/services/version-tree.service';

describe('Versions tree service', () => {
  describe('versions tree service', () => {
    let vts: VersionTreeService = null;
    var snapshots: IExplorationSnapshot[] = [{
      commit_type: 'create',
      version_number: 1,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
      commit_cmds: []
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'A',
        old_state_name: 'First State'
      }],
      version_number: 2,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'C',
        old_state_name: 'B'
      }],
      version_number: 3,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        version_number: 2,
        cmd: 'AUTO_revert_version_number'
      }],
      version_number: 4,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'D',
        old_state_name: 'A'
      }],
      version_number: 5,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        version_number: 3,
        cmd: 'AUTO_revert_version_number'
      }],
      version_number: 6,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'D'
      }],
      version_number: 7,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          html: 'Some text',
          audio_translations: {}
        },
        old_value: {
          html: '',
          audio_translations: {}
        },
        property_name: 'property'
      }],
      version_number: 8,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }];

    beforeEach(() => {
      vts = new VersionTreeService();
    });

    it('should get correct list of parents', () => {
      vts.init(snapshots);
      var expectedParents = {
        1: -1,
        2: 1,
        3: 2,
        4: 2,
        5: 4,
        6: 3,
        7: 6,
        8: 7
      };
      expect(vts.getVersionTree()).toEqual(expectedParents);
    });

    it('should find correct LCA', () => {
      vts.init(snapshots);
      expect(vts.findLCA(1, 6)).toBe(1);
      expect(vts.findLCA(3, 5)).toBe(2);
      expect(vts.findLCA(3, 8)).toBe(3);
      expect(vts.findLCA(3, 4)).toBe(2);
      expect(vts.findLCA(3, 3)).toBe(3);
      expect(vts.findLCA(2, 4)).toBe(2);
    });

    it('should get correct change list', () => {
      vts.init(snapshots);
      expect(() => {
        vts.getChangeList(1);
      }).toThrowError('Tried to retrieve change list of version 1');
      expect(vts.getChangeList(2)).toEqual([{
        cmd: 'add_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'A',
        old_state_name: 'First State'
      }]);
      expect(vts.getChangeList(4)).toEqual([{
        cmd: 'AUTO_revert_version_number',
        version_number: 2
      }]);
      expect(vts.getChangeList(5)).toEqual([{
        cmd: 'delete_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'D',
        old_state_name: 'A'
      }]);
      expect(vts.getChangeList(8)).toEqual([{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          html: 'Some text',
          audio_translations: {}
        },
        old_value: {
          html: '',
          audio_translations: {}
        },
        property_name: 'property'
      }]);
    });
  });
});
