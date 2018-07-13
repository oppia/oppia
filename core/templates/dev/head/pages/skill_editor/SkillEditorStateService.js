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
* @fileoverview Service for managing the state of the skill being edited
* in the skill editor.
*/

oppia.constant('EVENT_SKILL_INITIALIZED', 'skillInitialized');
oppia.constant('EVENT_SKILL_REINITIALIZED', 'skillReinitialized');

oppia.factory('SkillEditorStateService', [
  '$rootScope', 'SkillObjectFactory', 'SkillRightsObjectFactory',
  'EditableSkillBackendApiService', 'SkillRightsBackendApiService',
  'AlertsService', 'UndoRedoService', 'EVENT_SKILL_INITIALIZED',
  'EVENT_SKILL_REINITIALIZED',
  function(
      $rootScope, SkillObjectFactory, SkillRightsObjectFactory,
      EditableSkillBackendApiService, SkillRightsBackendApiService,
      AlertsService, UndoRedoService, EVENT_SKILL_INITIALIZED,
      EVENT_SKILL_REINITIALIZED) {
    var _skill = SkillObjectFactory.createInterstitialSkill();
    var _skillRights = SkillRightsObjectFactory.createInterstitialSkillRights();
    var _skillIsInitialized = false;
    var _skillIsBeingLoaded = false;
    var _skillIsBeingSaved = false;

    var _setSkill = function(skill) {
      _skill.copyFromSkill(skill);
      if (_skillIsInitialized) {
        $rootScope.$broadcast(EVENT_SKILL_REINITIALIZED);
      } else {
        $rootScope.$broadcast(EVENT_SKILL_INITIALIZED);
      }
      _skillIsInitialized = true;
    };

    var _updateSkill = function(newBackendSkillObject) {
      _setSkill(SkillObjectFactory.createFromBackendDict(
        newBackendSkillObject));
    };

    var _setSkillRights = function(skillRights) {
      _skillRights.copyFromSkillRights(skillRights);
    };

    var _updateSkillRights = function(newBackendSkillRightsObject) {
      _setSkillRights(SkillRightsObjectFactory.create(
        newBackendSkillRightsObject));
    };

    return {
      loadSkill: function(skillId) {
        _skillIsBeingLoaded = true;
        EditableSkillBackendApiService.fetchSkill(
          skillId).then(
          function(newBackendSkillObject) {
            _updateSkill(newBackendSkillObject);
            _skillIsBeingLoaded = false;
          }, function(error) {
            AlertsService.addWarning();
            _skillIsBeingLoaded = false;
          });
        SkillRightsBackendApiService.fetchSkillRights(
          skillId).then(function(newBackendSkillRightsObject) {
          _updateSkillRights(newBackendSkillRightsObject);
          _skillIsBeingLoaded = false;
        }, function(error) {
          AlertsService.addWarning(
            error ||
            'There was an error when loading the skill rights.');
          _skillIsBeingLoaded = false;
        });
      },

      isLoadingSkill: function() {
        return _skillIsBeingLoaded;
      },

      hasLoadedSkill: function() {
        return _skillIsInitialized;
      },

      getSkill: function() {
        return _skill;
      },

      saveSkill: function(commitMessage, successCallback) {
        if (!_skillIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot save a skill before one is loaded.');
        }

        if (!UndoRedoService.hasChanges()) {
          return false;
        }
        _skillIsBeingSaved = true;
        EditableSkillBackendApiService.updateSkill(
          _skill.getId(), _skill.getVersion(), commitMessage,
          UndoRedoService.getCommittableChangeList()).then(
          function(skillBackendObject) {
            _updateSkill(skillBackendObject);
            UndoRedoService.clearChanges();
            _skillIsBeingSaved = false;
            if (successCallback) {
              successCallback();
            }
          }, function(error) {
            AlertsService.addWarning(
              error || 'There was an error when saving the skill');
            _skillIsBeingSaved = false;
          });
        return true;
      },

      getSkillRights: function() {
        return _skillRights;
      },

      isSavingSkill: function() {
        return _skillIsBeingSaved;
      },

      setSkillRights: function(skillRights) {
        _setSkillRights(skillRights);
      }
    };
  }]);
