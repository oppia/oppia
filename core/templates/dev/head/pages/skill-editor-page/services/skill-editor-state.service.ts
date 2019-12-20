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

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/question-backend-api.service.ts');
require('domain/skill/editable-skill-backend-api.service.ts');
require('domain/skill/SkillObjectFactory.ts');
require('domain/skill/skill-rights-backend-api.service.ts');
require('domain/skill/SkillRightsObjectFactory.ts');
require('services/alerts.service.ts');
require('services/questions-list.service.ts');

require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');

angular.module('oppia').factory('SkillEditorStateService', [
  '$rootScope', 'AlertsService', 'EditableSkillBackendApiService',
  'QuestionsListService', 'SkillObjectFactory', 'SkillRightsBackendApiService',
  'SkillRightsObjectFactory', 'UndoRedoService',
  'EVENT_SKILL_INITIALIZED', 'EVENT_SKILL_REINITIALIZED',
  function(
      $rootScope, AlertsService, EditableSkillBackendApiService,
      QuestionsListService, SkillObjectFactory, SkillRightsBackendApiService,
      SkillRightsObjectFactory, UndoRedoService,
      EVENT_SKILL_INITIALIZED, EVENT_SKILL_REINITIALIZED) {
    var _skill = SkillObjectFactory.createInterstitialSkill();
    var _skillRights = SkillRightsObjectFactory.createInterstitialSkillRights();
    var _skillIsInitialized = false;
    var _skillIsBeingLoaded = false;
    var _skillIsBeingSaved = false;
    var _groupedSkillSummaries = {
      current: [],
      others: []
    };

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

    var _updateGroupedSkillSummaries = function(groupedSkillSummaries) {
      var topicName = null;
      var sortedSkillSummaries = [];
      _groupedSkillSummaries.current = [];
      _groupedSkillSummaries.others = [];

      for (var name in groupedSkillSummaries) {
        var skillSummaries = groupedSkillSummaries[name];
        for (var idx in skillSummaries) {
          if (skillSummaries[idx].id === _skill.getId()) {
            topicName = name;
            break;
          }
        }
        if (topicName !== null) {
          break;
        }
      }
      for (var idx in groupedSkillSummaries[topicName]) {
        _groupedSkillSummaries.current.push(
          groupedSkillSummaries[topicName][idx]);
      }
      for (var name in groupedSkillSummaries) {
        if (name === topicName) {
          continue;
        }
        var skillSummaries = groupedSkillSummaries[name];
        for (var idx in skillSummaries) {
          _groupedSkillSummaries.others.push(skillSummaries[idx]);
        }
      }
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
            _updateSkill(newBackendSkillObject.skill);
            _updateGroupedSkillSummaries(
              newBackendSkillObject.groupedSkillSummaries);
            QuestionsListService.getQuestionSummariesAsync(
              [skillId], true, false
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

      getGroupedSkillSummaries: function() {
        return angular.copy(_groupedSkillSummaries);
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
