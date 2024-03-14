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
 * @fileoverview Unit tests for ExplorationPermissions.
 */

import {ExplorationPermissions} from 'domain/exploration/exploration-permissions.model';

describe('Exploration permissions model', () => {
  it('should correctly convert backend dict to permissions object.', () => {
    let backendDict = {
      can_unpublish: true,
      can_release_ownership: false,
      can_publish: false,
      can_voiceover: true,
      can_delete: false,
      can_modify_roles: true,
      can_edit: true,
      can_manage_voice_artist: true,
    };

    let permissionsObject =
      ExplorationPermissions.createFromBackendDict(backendDict);

    expect(permissionsObject.canUnpublish).toEqual(true);
    expect(permissionsObject.canReleaseOwnership).toEqual(false);
    expect(permissionsObject.canPublish).toEqual(false);
    expect(permissionsObject.canVoiceover).toEqual(true);
    expect(permissionsObject.canDelete).toEqual(false);
    expect(permissionsObject.canModifyRoles).toEqual(true);
    expect(permissionsObject.canEdit).toEqual(true);
    expect(permissionsObject.canManageVoiceArtist).toEqual(true);
  });
});
