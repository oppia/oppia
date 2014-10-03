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
 * @fileoverview Unit tests for the services of the history page.
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

ddescribe('Versions tree service', function() {
  beforeEach(module('oppia'));

  describe('versions tree service', function() {
    var vts = null;
    var snapshots = [
      {
        'commit_type': 'create',
        'version_number': 1
      },
      {
        'commit_type': 'edit',
        'version_number': 2
      },
      {
        'commit_type': 'edit',
        'version_number': 3
      },
      {
        'commit_type': 'revert',
        'commit_cmds': [{
          'version_number': 2,
          'cmd': 'AUTO_revert_version_number'
        }],
        'version_number': 4
      },
      {
        'commit_type': 'edit',
        'version_number': 5
      },
      {
        'commit_type': 'revert',
        'commit_cmds': [{
          'version_number': 3,
          'cmd': 'AUTO_revert_version_number'
        }],
        'version_number': 6
      },
      {
        'commit_type': 'edit',
        'version_number': 7
      },
      {
        'commit_type': 'edit',
        'version_number': 8
      }
    ];

    beforeEach(inject(function($injector) {
      vts = $injector.get('versionsTreeService');
    }));

    iit('should get correct list of parents', function() {
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
      expect(vts.getVersionTree(snapshots)).toEqual(expectedParents);
    });

    it('should find correct LCA', function() {
      var treeParents = vts.getVersionTree(snapshots);
      expect(vts.findLCA(treeParents, 1, 6)).toBe(1);
      expect(vts.findLCA(treeParents, 3, 5)).toBe(2);
      expect(vts.findLCA(treeParents, 3, 8)).toBe(3);
      expect(vts.findLCA(treeParents, 3, 4)).toBe(2);
      expect(vts.findLCA(treeParents, 3, 3)).toBe(3);
      expect(vts.findLCA(treeParents, 2, 4)).toBe(2);
    });
  });
});
