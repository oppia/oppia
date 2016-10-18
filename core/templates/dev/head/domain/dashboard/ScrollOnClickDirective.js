oppia.directive('scrollOnClick', function() {
  return {
    restrict: 'A',
    scope: {
      isDropdownOpen: '=isDropdownOpen',
      isPrivate: '=isPrivate'
    },
    link: function(scope, element) {
      var isDisabled;
      // This value is roughly equal to the height of the topbar, so that the
      // content is not hidden behind it when the scrolltop is set.
      var SCROLLTOP_ADDED_OFFSET = 60;
      scope.$watch('isDropdownOpen', function() {
        isDisabled = scope.isDropdownOpen || scope.isPrivate;
      });
      element.on('click', function() {
        if (!isDisabled) {
          $('html, body').animate({
            scrollTop: element.offset().top - SCROLLTOP_ADDED_OFFSET
          }, 'slow');
        }
      });
    }
  };
});
