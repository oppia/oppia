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
    var SkillRights = function(skillRightsObject) {
      this._skillId = skillRightsObject.skill_id;
      this._creatorId = skillRightsObject.creator_id;
      this._skillIsPrivate = skillRightsObject.skill_is_private;
      this._skillIsEditable = skillRightsObject.can_edit_skill;
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

    SkillRights.prototype.canEdit = function() {
      return this._skillIsEditable;
    };

    SkillRights.prototype.setPublic = function() {
      if (this.canEdit()) {
        this._skillIsPrivate = false;
      } else {
        throw new Error('User is not allowed to edit this skill.');
      }
    };

    SkillRights.create = function(skillRightsBackendObject) {
      return new SkillRights(angular.copy(skillRightsBackendObject));
    };

    SkillRights.prototype.copyFromSkillRights = function(otherSkillRights) {
      this._skillId = otherSkillRights.getSkillId();
      this._creatorId = otherSkillRights.getCreatorId();
      this._skillIsPrivate = otherSkillRights.isPrivate();
      this._skillIsEditable = otherSkillRights.canEdit();
    };

    SkillRights.createInterstitialSkillRights = function() {
      return new SkillRights({
        skill_id: null,
        creator_id: null,
        skill_is_private: true,
        can_edit_skill: false
      });
    };

    return SkillRights;
  }])
