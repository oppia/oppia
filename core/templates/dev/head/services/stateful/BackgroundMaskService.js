// Service for enabling a background mask that leaves navigation visible.
oppia.factory('BackgroundMaskService', function() {
  var maskIsActive = false;

  return {
    isMaskActive: function() {
      return maskIsActive;
    },
    activateMask: function() {
      maskIsActive = true;
    },
    deactivateMask: function() {
      maskIsActive = false;
    }
  };
});
