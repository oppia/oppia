angular.module('libraryFooterModule').controller('LibraryFooter', [
  '$scope', '$window', 'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES',
  function($scope, $window, LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES) {
    var pageMode = LIBRARY_PATHS_TO_MODES[$window.location.pathname];
    $scope.footerIsDisplayed = (pageMode !== LIBRARY_PAGE_MODES.SEARCH);
  }
]);
