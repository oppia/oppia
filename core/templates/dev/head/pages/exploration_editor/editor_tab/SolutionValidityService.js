// Service for keeping track of solution validity.
oppia.factory('SolutionValidityService', [

  function() {
    return {
      init: function() {
        this.solutionValidities = {};
      },
      updateValidity: function(stateName, solutionIsValid) {
        this.solutionValidities[stateName] = solutionIsValid;
      },
      isSolutionValid: function(stateName) {
        if (this.solutionValidities.hasOwnProperty(stateName)) {
          return this.solutionValidities[stateName];
        }
      },
      deleteSolutionValidity: function(stateName) {
        delete this.solutionValidities[stateName];
      },
      getAllValidities: function() {
        return this.solutionValidities;
      }
    }
  }]);
