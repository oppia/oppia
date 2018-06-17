oppia.directive('skillDescriptionEditor', [
  'UrlInterpolationService', 'SkillUpdateService', 'SkillEditorStateService',
  function(
      UrlInterpolationService, SkillUpdateService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_description_editor_directive.html'),
      controller: [
        '$scope',
        function($scope) {
          var skill = SkillEditorStateService.getSkill();
          $scope.skillDescriptionEditorIsShown = false;
          $scope.skillDescription = skill.getDescription();

          $scope.openSkillDescriptionEditor = function() {
            $scope.skillDescriptionEditorIsShown = true;
            $scope.tmpSkillDescription = $scope.skillDescription;
          };

          $scope.saveSkillDescription = function(newSkillDescription) {
            $scope.skillDescriptionEditorIsShown = false;
            SkillUpdateService.setSkillDescription(
              skill,
              newSkillDescription);
          };
        }
      ]
    }
  }
]);