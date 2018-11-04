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
 * @fileoverview Factory for creating and mutating instances of frontend
 * skill rights domain objects.
 */

oppia.factory('SkillRightsObjectFactory', [
  function() {
    var SkillRights = function(
        skillId, creatorId, skillIsPrivate, canEditSkillDescription) {
      this._skillId = skillId;
      this._creatorId = creatorId;
      this._skillIsPrivate = skillIsPrivate;
      this._skillDescriptionIsEditable = canEditSkillDescription;
    };

    SkillRights.prototype.getSkillId = function() {
      return this._skillId;
    };

    SkillRights.prototype.getCreatorId = function() {
      return this._creatorId;
    };

    SkillRights.prototype.isPrivate = function() {
      return this._skillIsPrivate;
    };

    SkillRights.prototype.isPublic = function() {
      return !this._skillIsPrivate;
    };

    SkillRights.prototype.canEditSkillDescription = function() {
      return this._skillDescriptionIsEditable;
    };

    SkillRights.prototype.setPublic = function() {
      this._skillIsPrivate = false;
    };

    SkillRights.createFromBackendDict = function(skillRightsBackendDict) {
      return new SkillRights(
        skillRightsBackendDict.skill_id,
        skillRightsBackendDict.creator_id,
        skillRightsBackendDict.skill_is_private,
        skillRightsBackendDict.can_edit_skill_description);
    };

    SkillRights.prototype.copyFromSkillRights = function(otherSkillRights) {
      this._skillId = otherSkillRights.getSkillId();
      this._creatorId = otherSkillRights.getCreatorId();
      this._skillIsPrivate = otherSkillRights.isPrivate();
      this._skillDescriptionIsEditable =
        otherSkillRights.canEditSkillDescription();
    };

    SkillRights.createInterstitialSkillRights = function() {
      return new SkillRights(null, null, true, false);
    };

    return SkillRights;
  }]);
