angular.module('libraryPageModule', ['activityTilesInfinityGridModule', 'libraryFooterModule', 'searchBarModule', 'searchResultsModule']);

angular.module('libraryPageModule').constant('LIBRARY_PAGE_MODES', {
    GROUP: 'group',
    INDEX: 'index',
    SEARCH: 'search'
  });

angular.module('libraryPageModule').constant('LIBRARY_PATHS_TO_MODES', {
  '/library': 'index',
  '/library/top_rated': 'group',
  '/library/recently_published': 'group',
  '/search/find': 'search'
});
