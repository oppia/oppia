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
 * @fileoverview Service to handle the updating of a skill.
 */

require('domain/editor/undo_redo/ChangeObjectFactory.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/skill/SkillObjectFactory.ts');

require('domain/skill/skill-domain.constants.ajs.ts');

angular.module('oppia').factory('SkillUpdateService', [
  'ChangeObjectFactory',
  'UndoRedoService', 'CMD_ADD_SKILL_MISCONCEPTION',
  'CMD_DELETE_SKILL_MISCONCEPTION', 'CMD_UPDATE_RUBRICS',
  'CMD_UPDATE_SKILL_CONTENTS_PROPERTY',
  'CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY',
  'CMD_UPDATE_SKILL_PROPERTY',
  'SKILL_CONTENTS_PROPERTY_EXPLANATION',
  'SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES', 'SKILL_DIFFICULTIES',
  'SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK',
  'SKILL_MISCONCEPTIONS_PROPERTY_NAME',
  'SKILL_MISCONCEPTIONS_PROPERTY_NOTES', 'SKILL_PROPERTY_DESCRIPTION',
  function(
      ChangeObjectFactory,
      UndoRedoService, CMD_ADD_SKILL_MISCONCEPTION,
      CMD_DELETE_SKILL_MISCONCEPTION, CMD_UPDATE_RUBRICS,
      CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
      CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
      CMD_UPDATE_SKILL_PROPERTY,
      SKILL_CONTENTS_PROPERTY_EXPLANATION,
      SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES, SKILL_DIFFICULTIES,
      SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK,
      SKILL_MISCONCEPTIONS_PROPERTY_NAME,
      SKILL_MISCONCEPTIONS_PROPERTY_NOTES, SKILL_PROPERTY_DESCRIPTION) {
    var _applyChange = function(skill, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
      UndoRedoService.applyChange(changeObj, skill);
    };

    var _applyPropertyChange = function(
        skill, propertyName, newValue, oldValue, apply, reverse) {
      _applyChange(skill, CMD_UPDATE_SKILL_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue),
      }, apply, reverse);
    };

    var _applyMisconceptionPropertyChange = function(
        skill, misconceptionId, propertyName, newValue, oldValue,
        apply, reverse) {
      _applyChange(skill, CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue),
        misconception_id: misconceptionId,
      }, apply, reverse);
    };

    var _applyRubricPropertyChange = function(
        skill, difficulty, explanation, apply, reverse) {
      _applyChange(skill, CMD_UPDATE_RUBRICS, {
        difficulty: angular.copy(difficulty),
        explanation: angular.copy(explanation)
      }, apply, reverse);
    };

    var _applySkillContentsPropertyChange = function(
        skill, propertyName, newValue, oldValue, apply, reverse) {
      _applyChange(skill, CMD_UPDATE_SKILL_CONTENTS_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue),
      }, apply, reverse);
    };

    var _getParameterFromChangeDict = function(changeDict, paramName) {
      return changeDict[paramName];
    };

    var _getNewPropertyValueFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'new_value');
    };

    return {
      setSkillDescription: function(skill, newDescription) {
        var oldDescription = angular.copy(skill.getDescription());
        _applyPropertyChange(
          skill, SKILL_PROPERTY_DESCRIPTION, newDescription, oldDescription,
          function(changeDict, skill) {
            var description = _getNewPropertyValueFromChangeDict(changeDict);
            skill.setDescription(description);
          }, function(changeDict, skill) {
            skill.setDescription(oldDescription);
          });
      },

      setConceptCardExplanation: function(skill, newExplanation) {
        var oldExplanation = skill.getConceptCard().getExplanation();
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_EXPLANATION,
          newExplanation.toBackendDict(), oldExplanation.toBackendDict(),
          function(changeDict, skill) {
            var explanation = newExplanation;
            skill.getConceptCard().setExplanation(explanation);
          }, function(changeDict, skill) {
            skill.getConceptCard().setExplanation(oldExplanation);
          });
      },

      addWorkedExample: function(skill, newWorkedExample) {
        var oldWorkedExamples = angular.copy(
          skill.getConceptCard().getWorkedExamples());
        var newWorkedExamples = angular.copy(oldWorkedExamples);
        newWorkedExamples.push(newWorkedExample);
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
          newWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }), oldWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }),
          function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      deleteWorkedExample: function(skill, index) {
        var oldWorkedExamples = angular.copy(
          skill.getConceptCard().getWorkedExamples());
        var newWorkedExamples = angular.copy(oldWorkedExamples);
        newWorkedExamples.splice(index, 1);
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
          newWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }), oldWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }),
          function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      updateWorkedExample: function(
          skill, workedExampleIndex, newWorkedExampleHtml) {
        var oldWorkedExamples = angular.copy(
          skill.getConceptCard().getWorkedExamples());
        var newWorkedExamples = angular.copy(oldWorkedExamples);
        newWorkedExamples[workedExampleIndex].setHtml(newWorkedExampleHtml);
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
          newWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }), oldWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }),
          function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      updateWorkedExamples: function(skill, newWorkedExamples) {
        var oldWorkedExamples = skill.getConceptCard().getWorkedExamples();
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
          newWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }), oldWorkedExamples.map(function(workedExample) {
            return workedExample.toBackendDict();
          }),
          function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      addMisconception: function(skill, newMisconception) {
        var params = {
          new_misconception_dict: newMisconception.toBackendDict()
        };
        var misconceptionId = newMisconception.getId();
        _applyChange(
          skill, CMD_ADD_SKILL_MISCONCEPTION, params,
          function(changeDict, skill) {
            skill.appendMisconception(newMisconception);
          }, function(changeDict, skill) {
            skill.deleteMisconception(misconceptionId);
          });
      },

      deleteMisconception: function(skill, misconceptionId) {
        var params = {
          misconception_id: misconceptionId
        };
        var oldMisconception = skill.findMisconceptionById(misconceptionId);
        _applyChange(
          skill, CMD_DELETE_SKILL_MISCONCEPTION, params,
          function(changeDict, skill) {
            skill.deleteMisconception(misconceptionId);
          }, function(changeDict, skill) {
            skill.appendMisconception(oldMisconception);
          });
      },

      updateMisconceptionName: function(
          skill, misconceptionId, oldName, newName) {
        var misconception = skill.findMisconceptionById(misconceptionId);
        if (misconception) {
          _applyMisconceptionPropertyChange(
            skill, misconceptionId, SKILL_MISCONCEPTIONS_PROPERTY_NAME,
            newName, oldName,
            function(changeDict, skill) {
              misconception.setName(newName);
            }, function(changeDict, skill) {
              misconception.setName(oldName);
            });
        }
      },

      updateMisconceptionNotes: function(
          skill, misconceptionId, oldNotes, newNotes) {
        var misconception = skill.findMisconceptionById(misconceptionId);
        if (misconception) {
          _applyMisconceptionPropertyChange(
            skill, misconceptionId, SKILL_MISCONCEPTIONS_PROPERTY_NOTES,
            newNotes, oldNotes,
            function(changeDict, skill) {
              misconception.setNotes(newNotes);
            }, function(changeDict, skill) {
              misconception.setNotes(oldNotes);
            });
        }
      },

      updateMisconceptionFeedback: function(
          skill, misconceptionId, oldFeedback, newFeedback) {
        var misconception = skill.findMisconceptionById(misconceptionId);
        if (misconception) {
          _applyMisconceptionPropertyChange(
            skill, misconceptionId, SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK,
            newFeedback, oldFeedback,
            function(changeDict, skill) {
              misconception.setFeedback(newFeedback);
            }, function(changeDict, skill) {
              misconception.setFeedback(oldFeedback);
            });
        }
      },

      updateRubricForDifficulty: function(skill, difficulty, explanation) {
        if (SKILL_DIFFICULTIES.indexOf(difficulty) === -1) {
          throw Error('Invalid difficulty value passed');
        }
        var oldExplanation = skill.getRubricExplanation(difficulty);
        _applyRubricPropertyChange(
          skill, difficulty, explanation,
          function(changeDict, skill) {
            skill.updateRubricForDifficulty(difficulty, explanation);
          }, function(changeDict, skill) {
            skill.updateRubricForDifficulty(difficulty, oldExplanation);
          });
      }
    };
  }
]);
