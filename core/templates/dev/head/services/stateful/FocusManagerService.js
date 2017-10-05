// Service for setting focus. This broadcasts a 'focusOn' event which sets
// focus to the element in the page with the corresponding focusOn attribute.
// Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
// page.
oppia.factory('FocusManagerService', [
  '$rootScope', '$timeout', 'deviceInfoService', 'LABEL_FOR_CLEARING_FOCUS',
  'IdGenerationService',
  function(
      $rootScope, $timeout, deviceInfoService, LABEL_FOR_CLEARING_FOCUS,
      IdGenerationService) {
    var _nextLabelToFocusOn = null;
    return {
      clearFocus: function() {
        this.setFocus(LABEL_FOR_CLEARING_FOCUS);
      },
      setFocus: function(name) {
        if (_nextLabelToFocusOn) {
          return;
        }

        _nextLabelToFocusOn = name;
        $timeout(function() {
          $rootScope.$broadcast('focusOn', _nextLabelToFocusOn);
          _nextLabelToFocusOn = null;
        });
      },
      setFocusIfOnDesktop: function(newFocusLabel) {
        if (!deviceInfoService.isMobileDevice()) {
          this.setFocus(newFocusLabel);
        }
      },
      // Generates a random string (to be used as a focus label).
      generateFocusLabel: function() {
        return IdGenerationService.generateNewId();
      }
    };
  }
]);
