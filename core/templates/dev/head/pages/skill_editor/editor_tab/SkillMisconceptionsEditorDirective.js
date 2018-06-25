oppia.directive('skillMisconceptionsEditor', [
  'UrlInterpolationService', 'SkillUpdateService', 'SkillEditorStateService',
  function(
      UrlInterpolationService, SkillUpdateService, SkillEditorStateService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill_editor/editor_tab/' +
        'skill_misconceptions_editor_directive.html'),
      controller: [
        '$scope', '$filter', '$uibModal', '$rootScope',
        'MisconceptionObjectFactory',
        function(
            $scope, $filter, $uibModal, $rootScope,
            MisconceptionObjectFactory) {
          $scope.skill = SkillEditorStateService.getSkill();
          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
              '/general/drag_dots.png');

          $scope.isEditable = function() {
            return true;
          };

          // When the page is scrolled so that the top of the page is above the
          // browser viewport, there are some bugs in the positioning of the helper.
          // This is a bug in jQueryUI that has not been fixed yet. For more details,
          // see http://stackoverflow.com/q/5791886
          $scope.MISCONCEPTIONS_SORTABLE_OPTIONS = {
            axis: 'y',
              cursor: 'move',
              handle: '.oppia-misconception-sort-handle',
              items: '.oppia-sortable-misconception',
              revert: 100,
              tolerance: 'pointer',
              start: function(e, ui) {
                $rootScope.$broadcast('externalSave');
                $scope.activeMisconceptionIndex = null;
                ui.placeholder.height(ui.item.height());
                misconceptionsMemento = angular.copy(
                  $scope.skill.getMisconceptions());
              },
              stop: function() {
                var newMisconceptions = angular.copy(
                  $scope.skill.getMisconceptions());
                SkillUpdateService.updateMisconceptions(
                  $scope.skill, misconceptionsMemento, newMisconceptions);
                misconceptionsMemento = angular.copy(newMisconceptions);
              }
          };  

          $scope.changeActiveMisconceptionIndex = function(idx) {
            if (idx === $scope.activeMisconceptionIndex) {
              $scope.activeMisconceptionIndex = null;
            } else {
              $scope.activeMisconceptionIndex = idx;
            }
          };

          $scope.getMisconceptionSummary = function(misconception) {
            return angular.copy(misconception.name);
          };

          $scope.removeMisconception = function(index, evt) {
            SkillUpdateService.removeMisconception($scope.skill, index);
          };

          $scope.openAddMisconceptionModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/skill_editor/editor_tab/add_misconception_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.skill = SkillEditorStateService.getSkill();
                  $scope.MISCONCEPTION_PROPERTY_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.misconceptionName = '';
                  $scope.misconceptionNotes = '';
                  $scope.misconceptionFeedback = '';

                  $scope.saveMisconception = function() {
                    var newMisconceptionId =
                      $scope.skill.getNextMisconceptionId();
                    $uibModalInstance.close({
                      misconception: MisconceptionObjectFactory.create(
                        newMisconceptionId,
                        $scope.misconceptionName,
                        $scope.misconceptionNotes,
                        $scope.misconceptionFeedback)
                    });
                  }

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }]
            }).result.then(function(result) {
              SkillUpdateService.addMisconception(
                $scope.skill, result.misconception);
            });
          };
        }]
      }
  }
]);
