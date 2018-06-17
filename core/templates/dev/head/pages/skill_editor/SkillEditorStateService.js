oppia.factory('SkillEditorStateService', [
  'SkillObjectFactory', 'EditableSkillBackendApiService',
  'AlertsService',
  function(
      SkillObjectFactory, EditableSkillBackendApiService,
      AlertsService) {
    var _skill = SkillObjectFactory.createEmptySkill();
    var _skillIsInitialized = false;
    var _isLoadingSkill = false;
    var _isSavingSkill = false;

    var _setSkill = function(skill) {
      _skill.copyFromSkill(skill);
      _skillIsInitialized = true;
    };

    var _updateSkill = function(newBackendSkillObject) {
      _setSkill(SkillObjectFactory.createFromBackendDict(
        newBackendSkillObject));
      console.log(_skill);
    };

    return {
      loadSkill: function(skillId) {
        _isLoadingSkill = true;
        EditableSkillBackendApiService.fetchSkill(
          skillId).then(
          function(newBackendSkillObject) {
            _updateSkill(newBackendSkillObject);
          },
          function(error) {
            AlertsService.addWarning()
        });
      },

      isLoadingSkill: function() {
        return _isLoadingSkill;
      },

      hasLoadedSkill: function() {
        return _skillIsInitialized;
      },

      getSkill: function() {
        return _skill;
      },

      setSkill: function(skill) {
        _setSkill(skill);
      },

      saveSkill: function(commitMessage, successCallback) {
        if (!_skillIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot save a skill before one is loaded.');
        }

        if (!UndoRedoService.hasChanges()) {
          return false;
        }
        _isSavingSkill = true;
        EditableSkillBackendApiService.updateSkill(
          _skill.getId(), commitMessage,
          UndoRedoService.getCommitableChangeList()).then(
          function(skillBackendObject) {
            _updateSkill(skillBackendObject);
            UndoRedoService.clearChanges();
            _isSavingCollection = false;
            if (successCallback) {
              successCallback();
            }
          }, function(error) {
            AlertsService.addWarning(
              error || 'There was an error when saving the skill');
            _isSavingSkill = false;
          });
        return true;
      }
    };
  }])