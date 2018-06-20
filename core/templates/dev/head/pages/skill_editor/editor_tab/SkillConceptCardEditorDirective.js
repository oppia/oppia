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
        '$scope', '$filter', '$uibModal',
        function($scope, $filter, $uibModal) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/drag_dots.png');
          $scope.HTML_SCHEMA = {
            type: 'html'
          };

          $scope.isEditable = function() {
            return true;
          };

          // When the page is scrolled so that the top of the page is above the
          // browser viewport, there are some bugs in the positioning of the helper.
          // This is a bug in jQueryUI that has not been fixed yet. For more details,
          // see http://stackoverflow.com/q/5791886
          $scope.WORKED_EXAMPLES_SORTABLE_OPTIONS = {
            axis: 'y',
            cursor: 'move',
            handle: '.oppia-worked-example-sort-handle',
            items: '.oppia-sortable-worked-example',
            revert: 100,
            tolerance: 'pointer',
            start: function(e, ui) {
              $rootScope.$broadcast('externalSave');
              $scope.activeWorkedExampleIndex = null;
              ui.placeholder.height(ui.item.height());
            },
            stop: function() {
              //update
            }
          };

          $scope.changeActiveWorkedExampleIndex = function(idx) {
            $scope.activeWorkedExampleIndex = idx;
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

          $scope.removeWorkedExample = function(index, evt) {
            SkillUpdateService.removeWorkedExample($scope.skill, index);
          };

          $scope.swapWorkedExample = function(indexOne, indexTwo) {
            SkillUpdateService.swapWorkedExamples($scope.skill, indexOne, indexTwo);
          };

          $scope.canDeleteWorkedExample = function() {
            return true;
          };

          $scope.getWorkedExampleSummary = function(workedExample) {
            return $filter('formatRtePreview')(workedExample);
          };

          $scope.openAddWorkedExampleModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/editor_tab/add_worked_example_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.WORKED_EXAMPLE_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.tmpWorkedExampleHtml = '';
                  $scope.saveWorkedExample = function() {
                    $uibModalInstance.close({
                      workedExample: $scope.tmpWorkedExampleHtml
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              SkillUpdateService.addWorkedExample(
                $scope.skill, result.workedExample);
              console.log(angular.copy($scope.skill.getConceptCard().getWorkedExamples()));
            });
          };
        }
      ]
    }
  }
]);