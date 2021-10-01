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
 * @fileoverview Frontend model for user exploration permissions.
 */

export interface ExplorationPermissionsBackendDict {
  'can_unpublish': boolean;
  'can_release_ownership': boolean;
  'can_publish': boolean;
  'can_voiceover': boolean;
  'can_delete': boolean;
  'can_modify_roles': boolean;
  'can_edit': boolean;
  'can_manage_voice_artist': boolean;
}

export class ExplorationPermissions {
  canUnpublish: boolean;
  canReleaseOwnership: boolean;
  canPublish: boolean;
  canVoiceover: boolean;
  canDelete: boolean;
  canModifyRoles: boolean;
  canEdit: boolean;
  canManageVoiceArtist: boolean;

  constructor(
      canUnpublish: boolean, canReleaseOwnership: boolean, canPublish: boolean,
      canVoiceover: boolean, canDelete: boolean, canModifyRoles: boolean,
      canEdit: boolean, canManageVoiceArtist: boolean) {
    this.canUnpublish = canUnpublish;
    this.canReleaseOwnership = canReleaseOwnership;
    this.canPublish = canPublish;
    this.canVoiceover = canVoiceover;
    this.canDelete = canDelete;
    this.canModifyRoles = canModifyRoles;
    this.canEdit = canEdit;
    this.canManageVoiceArtist = canManageVoiceArtist;
  }

  static createFromBackendDict(
      backendDict: ExplorationPermissionsBackendDict): ExplorationPermissions {
    return new ExplorationPermissions(
      backendDict.can_unpublish, backendDict.can_release_ownership,
      backendDict.can_publish, backendDict.can_voiceover,
      backendDict.can_delete, backendDict.can_modify_roles,
      backendDict.can_edit, backendDict.can_manage_voice_artist);
  }
}
