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
        id: angular.copy(misconceptionId),
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

      setConceptCardExplanation: function(skill, oldExplanation, newExplanation) {
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_EXPLANATION,
          newExplanation, oldExplanation,
          function(changeDict, skill) {
            var explanation = _getNewPropertyValueFromChangeDict(changeDict);
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
          newWorkedExamples, oldWorkedExamples,
          function(changeDict, skill) {
            var newWorkedExamples = _getNewPropertyValueFromChangeDict(changeDict);
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      updateWorkedExample: function(
          skill, workedExampleIndex, newWorkedExample) {
        var oldWorkedExamples = angular.copy(
          skill.getConceptCard().getWorkedExamples());
        var newWorkedExamples = angular.copy(oldWorkedExamples);
        newWorkedExamples[workedExampleIndex] = newWorkedExample;
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
          newWorkedExamples, oldWorkedExamples,
          function(changeDict, skill) {
            var newWorkedExamples = _getNewPropertyValueFromChangeDict(changeDict);
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      updateWorkedExamples: function(
        skill, oldWorkedExamples, newWorkedExamples) {
        _applySkillContentsPropertyChange(
          skill, SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES,
          newWorkedExamples, oldWorkedExamples,
          function(changeDict, skill) {
            var newWorkedExamples = _getNewPropertyValueFromChangeDict(changeDict);
            skill.getConceptCard().setWorkedExamples(newWorkedExamples);
          }, function(changeDict, skill) {
            skill.getConceptCard().setWorkedExamples(oldWorkedExamples);
          });
      },

      addMisconception: function(skill, newMisconception) {
        var params = {
          new_value: newMisconception.toBackendDict()
        };
        _applyChange(
          skill, CMD_ADD_SKILL_MISCONCEPTION, params,
          function(changeDict, skill) {
            skill.appendMisconception(newMisconception);
          }, function(changeDict, skill) {
            skill.removeLastMisconception();
          });
      },

      deleteMisconception: function(
        skill, index) {
        
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
    }
  }
]);