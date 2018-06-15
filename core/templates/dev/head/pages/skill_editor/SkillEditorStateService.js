oppia.factory('SkillEditorStateService', [
  'SkillObjectFactory', 'EditableSkillBackendApiService',
  'AlertsService',
  function(
      SkillObjectFactory, EditableSkillBackendApiService,
      AlertsService) {
    var _skill = SkillObjectFactory.createEmptySkill();
    var _skillIsInitialized = false;
    var _isLoadingSkill = false;

    var _setSkill = function(skill) {
      _skill = angular.copy(skill);
      _skillIsInitialized = true;
    };

    var _updateSkill = function(newBackendSkillObject) {
      _setSkill()
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
        console.log("Not implemented.");
      }
    };
  }])