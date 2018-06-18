oppia.directive('skillConceptCardEditor', [
  'UrlInterpolationService', 'SkillUpdateService', 'SkillEditorStateService',
  function (
      UrlInterpolationService, SkillUpdateService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_concept_card_editor_directive.html'),
      controller: [
        '$scope',
        function($scope) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.workedExamples =
            SkillEditorStateService.getSkill().getWorkedExamples();
          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/drag_dots.png');
          $scope.HTML_SCHEMA = {
            type: 'html'
          };
          var explanationMemento =
            $scope.skill.getConceptCard().getExplanation();

          $scope.conceptCardExplanationEditorIsShown = false;

          $scope.openConceptCardExplanationEditor = function() {
            $scope.conceptCardExplanationEditorIsShown = true;
          };

          $scope.closeConceptCardExplanationEditor = function() {
            $scope.conceptCardExplanationEditorIsShown = false;
            $scope.skill.getConceptCard().setExplanation(explanationMemento);
          };

          $scope.saveConceptCardExplanation = function() {
            var explanation =
              $scope.skill.getConceptCard().getExplanation();
            $scope.conceptCardExplanationEditorIsShown = false;
            SkillUpdateService.setConceptCardExplanation(
              $scope.skill,
              explanationMemento,
              explanation);
            explanationMemento = explanation;
          };

          $scope.addWorkedExample = function(workedExample) {
            SkillUpdateService.addWorkedExample($scope.skill, workedExample);
          };

          $scope.removeWorkedExample = function(index, evt) {
            SkillUpdateService.removeWorkedExample($scope.skill, index);
          };

          $scope.swapWorkedExample = function(indexOne, indexTwo) {
            SkillUpdateService.swapWorkedExamples($scope.skill, indexOne, indexTwo);
          };
        }
      ]
    }
  }
]);