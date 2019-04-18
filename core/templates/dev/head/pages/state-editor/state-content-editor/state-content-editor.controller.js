angular.module('stateContentEditorModule').controller('stateContentEditorController', [
    '$scope', 'StateContentService', 'EditabilityService',
    'EditorFirstTimeEventsService',
    function(
        $scope, StateContentService, EditabilityService,
        EditorFirstTimeEventsService) {
      $scope.HTML_SCHEMA = {
        type: 'html'
      };
      $scope.contentId = null;
      $scope.StateContentService = StateContentService;
      if (StateContentService.displayed) {
        $scope.contentId = StateContentService.displayed.getContentId();
      }

      $scope.contentEditorIsOpen = false;
      $scope.isEditable = EditabilityService.isEditable;
      $scope.cardHeightLimitWarningIsShown = true;

      $scope.isCardHeightLimitReached = function() {
        var shadowPreviewCard = $(
          '.oppia-shadow-preview-card .oppia-learner-view-card-top-section'
        );
        var height = shadowPreviewCard.height();
        return (height > 630);
      };

      $scope.hideCardHeightLimitWarning = function() {
        $scope.cardHeightLimitWarningIsShown = false;
      };

      var saveContent = function() {
        StateContentService.saveDisplayedValue();
        $scope.onSaveStateContent(StateContentService.displayed);
        $scope.contentEditorIsOpen = false;
      };

      $scope.$on('externalSave', function() {
        if ($scope.contentEditorIsOpen) {
          saveContent();
        }
      });

      $scope.openStateContentEditor = function() {
        if ($scope.isEditable()) {
          EditorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
          $scope.contentEditorIsOpen = true;
        }
      };

      $scope.onSaveContentButtonClicked = function() {
        EditorFirstTimeEventsService.registerFirstSaveContentEvent();
        var savedContent = StateContentService.savedMemento;
        var contentHasChanged = (
          savedContent.getHtml() !==
          StateContentService.displayed.getHtml());
        if (contentHasChanged) {
          var contentId = StateContentService.displayed.getContentId();
          $scope.showMarkAllAudioAsNeedingUpdateModalIfRequired(contentId);
        }
        saveContent();
      };

      $scope.cancelEdit = function() {
        StateContentService.restoreFromMemento();
        $scope.contentEditorIsOpen = false;
      };
    }
]);