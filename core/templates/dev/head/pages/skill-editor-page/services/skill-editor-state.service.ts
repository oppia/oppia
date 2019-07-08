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

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/question/QuestionBackendApiService.ts');
require('domain/skill/EditableSkillBackendApiService.ts');
require('domain/skill/SkillObjectFactory.ts');
require('domain/skill/SkillRightsBackendApiService.ts');
require('domain/skill/SkillRightsObjectFactory.ts');
require('services/AlertsService.ts');
require('services/QuestionsListService.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('SkillEditorStateService', [
  '$rootScope', 'AlertsService', 'EditableSkillBackendApiService',
  'QuestionBackendApiService', 'QuestionsListService',
  'SkillObjectFactory', 'SkillRightsBackendApiService',
  'SkillRightsObjectFactory', 'UndoRedoService',
  'EVENT_QUESTION_SUMMARIES_INITIALIZED',
  'EVENT_SKILL_INITIALIZED', 'EVENT_SKILL_REINITIALIZED',
  function(
      $rootScope, AlertsService, EditableSkillBackendApiService,
      QuestionBackendApiService, QuestionsListService,
      SkillObjectFactory, SkillRightsBackendApiService,
      SkillRightsObjectFactory, UndoRedoService,
      EVENT_QUESTION_SUMMARIES_INITIALIZED,
      EVENT_SKILL_INITIALIZED, EVENT_SKILL_REINITIALIZED) {
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
      _setSkillRights(SkillRightsObjectFactory.createFromBackendDict(
        newBackendSkillRightsObject));
    };
    return {
      loadSkill: function(skillId) {
        _skillIsBeingLoaded = true;
        EditableSkillBackendApiService.fetchSkill(
          skillId).then(
          function(newBackendSkillObject) {
            _updateSkill(newBackendSkillObject);
            QuestionsListService.getQuestionSummariesAsync(
              0, [skillId], true, false
            );
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
