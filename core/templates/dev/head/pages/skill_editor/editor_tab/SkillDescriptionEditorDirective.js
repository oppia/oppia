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
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.skillDescriptionEditorIsShown = false;

          $scope.openSkillDescriptionEditor = function() {
            $scope.skillDescriptionEditorIsShown = true;
            $scope.tmpSkillDescription = $scope.skill.getDescription();
          };

          $scope.saveSkillDescription = function(newSkillDescription) {
            $scope.skillDescriptionEditorIsShown = false;
            SkillUpdateService.setSkillDescription(
              $scope.skill,
              newSkillDescription);
          };
        }
      ]
    }
  }
]);