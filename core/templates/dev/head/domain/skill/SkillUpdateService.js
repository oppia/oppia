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

oppia.constant('SKILL_PROPERTY_DESCRIPTION', 'description');
oppia.constant('SKILL_PROPERTY_LANGUAGE_CODE', 'language_code');
oppia.constant('SKILL_CONTENTS_PROPERTY_EXPLANATION', 'explanation');
oppia.constant('SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES', 'worked_examples');
oppia.constant('SKILL_MISCONCEPTIONS_PROPERTY_NAME', 'name');
oppia.constant('SKILL_MISCONCEPTIONS_PROPERTY_NOTES', 'notes');
oppia.constant('SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK', 'feedback');

oppia.constant('CMD_UPDATE_SKILL_PROPERTY',
  'update_skill_property');
oppia.constant('CMD_UPDATE_SKILL_CONTENTS_PROPERTY',
  'update_skill_contents_property');
oppia.constant('CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY',
  'update_skill_misconceptions_property');

oppia.constant('CMD_ADD_SKILL_MISCONCEPTION',
  'add_skill_misconception');
oppia.constant('CMD_DELETE_SKILL_MISCONCEPTION',
  'delete_skill_misconception');

oppia.factory('SkillUpdateService', [
  'SkillObjectFactory', 'ChangeObjectFactory',
  'UndoRedoService', 'SKILL_PROPERTY_DESCRIPTION',
  'SKILL_PROPERTY_LANGUAGE_CODE', 'SKILL_CONTENTS_PROPERTY_EXPLANATION',
  'SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES',
  'SKILL_MISCONCEPTIONS_PROPERTY_NAME',
  'SKILL_MISCONCEPTIONS_PROPERTY_NOTES',
  'SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK',
  'CMD_UPDATE_SKILL_PROPERTY', 'CMD_UPDATE_SKILL_CONTENTS_PROPERTY',
  'CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY', 'CMD_ADD_SKILL_MISCONCEPTION',
  'CMD_DELETE_SKILL_MISCONCEPTION',
  function(
      SkillObjectFactory, ChangeObjectFactory,
      UndoRedoService, SKILL_PROPERTY_DESCRIPTION,
      SKILL_PROPERTY_LANGUAGE_CODE, SKILL_CONTENTS_PROPERTY_EXPLANATION,
      SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
      SKILL_MISCONCEPTIONS_PROPERTY_NAME,
      SKILL_MISCONCEPTIONS_PROPERTY_NOTES,
      SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK,
      CMD_UPDATE_SKILL_PROPERTY, CMD_UPDATE_SKILL_CONTENTS_PROPERTY,
      CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY, CMD_ADD_SKILL_MISCONCEPTION,
      CMD_DELETE_SKILL_MISCONCEPTION) {
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
        id: misconceptionId,
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
            var newWorkedExamples =
              _getNewPropertyValueFromChangeDict(changeDict);
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
          id: misconceptionId
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
      }
    };
  }
]);
