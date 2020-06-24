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
require('domain/skill/SkillObjectFactory.ts');
require('domain/skill/SkillRightsObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/skill/skill-rights-backend-api.service.ts');
require('pages/skill-editor-page/skill-editor-page.constants.ajs.ts');
require('services/alerts.service.ts');
require('services/questions-list.service.ts');
import { EventEmitter } from '@angular/core';

angular.module('oppia').factory('SkillEditorStateService', [
  'AlertsService', 'QuestionsListService',
  'SkillBackendApiService', 'SkillObjectFactory',
  'SkillRightsBackendApiService', 'SkillRightsObjectFactory', 'UndoRedoService',
  function(
      AlertsService, QuestionsListService,
      SkillBackendApiService, SkillObjectFactory,
      SkillRightsBackendApiService, SkillRightsObjectFactory, UndoRedoService) {
    var _skill = SkillObjectFactory.createInterstitialSkill();
    var _skillRights = (
      SkillRightsObjectFactory.createInterstitialSkillRights());
    var _skillIsInitialized = false;
    var _skillIsBeingLoaded = false;
    var _skillIsBeingSaved = false;
    var _groupedSkillSummaries = {
      current: [],
      others: []
    };
    var _skillChangedEventEmitter = new EventEmitter();
    var _setSkill = function(skill) {
      _skill.copyFromSkill(skill);
      _skillChangedEventEmitter.emit();
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
      /**
       * Loads, or reloads, the skill stored by this service given a
       * specified collection ID. See setSkill() for more information on
       * additional behavior of this function.
       */
      loadSkill: function(skillId) {
        _skillIsBeingLoaded = true;
        SkillBackendApiService.fetchSkill(
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
      /**
       * Returns whether this service is currently attempting to load the
       * skill maintained by this service.
       */
      isLoadingSkill: function() {
        return _skillIsBeingLoaded;
      },

      getGroupedSkillSummaries: function() {
        return angular.copy(_groupedSkillSummaries);
      },
      /**
       * Returns whether a skill has yet been loaded using either
       * loadSkill().
       */
      hasLoadedSkill: function() {
        return _skillIsInitialized;
      },
      /**
       * Returns the current skill to be shared among the skill
       * editor. Please note any changes to this skill will be propogated
       * to all bindings to it. This skill object will be retained for the
       * lifetime of the editor. This function never returns null, though it may
       * return an empty skill object if the skill has not yet been
       * loaded for this editor instance.
       */
      getSkill: function() {
        return _skill;
      },
      /**
       * Attempts to save the current skill given a commit message. This
       * function cannot be called until after a skill has been initialized
       * in this service. Returns false if a save is not performed due to no
       * changes pending, or true if otherwise. This function, upon success,
       * will clear the UndoRedoService of pending changes. This function also
       * shares behavior with setSkill(), when it succeeds.
       */
      saveSkill: function(commitMessage, successCallback) {
        if (!_skillIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot save a skill before one is loaded.');
        }
        // Don't attempt to save the skill if there are no changes pending.
        if (!UndoRedoService.hasChanges()) {
          return false;
        }
        _skillIsBeingSaved = true;
        SkillBackendApiService.updateSkill(
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

      get onSkillChange() {
        return _skillChangedEventEmitter;
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
