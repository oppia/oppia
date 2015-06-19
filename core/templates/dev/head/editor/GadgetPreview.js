oppia.directive('oppiaGadgetPreview', function() {
  return {
    restrict: 'E',
    scope: {
      gadgetId: '&',
      gadgetName: '&',
      gadgetCustomizationArgs: '&',
      showInStates: '&'
    },
    templateUrl: 'editor/gadgetPreview',
    controller: [
        '$scope', '$filter', 'editorContextService', 'extensionTagAssemblerService',
        function($scope, $filter, editorContextService, extensionTagAssemblerService) {
      var _generateHtml = function (){
        var gadgetNameElem = $('<div>').text($scope.gadgetName());
        gadgetNameElem.addClass('oppia-gadget-name');

        var el = $(
          '<oppia-gadget-' + $filter('camelCaseToHyphens')($scope.gadgetId()) + '>');
        el = extensionTagAssemblerService.formatCustomizationArgAttributesForElement(
          el, $scope.gadgetCustomizationArgs());
        var gadgetContent = $('<div>').addClass('oppia-gadget-content');
        gadgetContent.append(el)

        return ($('<div>').append(gadgetNameElem).append(gadgetContent)).html();
      };

      $scope.gadgetHtml = _generateHtml();

      $scope.$watchCollection('gadgetCustomizationArgs()', function(newVal, oldVal) {
        if(newVal !== oldVal) {
          $scope.gadgetHtml = _generateHtml();
        }
      }, true);

      $scope.$watch(function() {
        return editorContextService.getActiveStateName();
      }, function(currentStateName) {
        $scope.isVisible = $scope.showInStates().indexOf(currentStateName) !== -1;
      });
    }]
  };
});
