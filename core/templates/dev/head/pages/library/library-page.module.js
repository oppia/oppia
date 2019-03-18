angular.module('libraryPageModule', ['activityTilesInfinityGridModule', 'libraryFooterModule', 'searchBarModule', 'searchResultsModule']);

angular.module('libraryPageModule').constant('LIBRARY_PAGE_MODES', {
    GROUP: 'group',
    INDEX: 'index',
    SEARCH: 'search'
  });
