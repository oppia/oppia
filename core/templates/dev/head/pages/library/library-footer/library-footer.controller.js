angular.module('libraryFooterModule').controller('LibraryFooter', [
    '$scope', 'LIBRARY_PAGE_MODES', function($scope, LIBRARY_PAGE_MODES) {
      $scope.pageMode = GLOBALS.PAGE_MODE;
      $scope.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;
    }
  ]);;
