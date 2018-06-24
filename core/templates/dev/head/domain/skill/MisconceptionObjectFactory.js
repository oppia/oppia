oppia.factory('MisconceptionObjectFactory', [
  function() {
    var Misconception = function(name, notes, feedback) {
      this.name = name;
      this.notes = notes;
      this.feedback = feedback;
    };

    Misconception.prototype.toBackendDict = function() {
      return {
        name: this.name,
        notes: this.notes,
        feedback: this.feedback
      };
    };

    Misconception.createFromBackendDict = function(misconceptionBackendDict) {
      return new Misconception(
        misconceptionBackendDict.name,
        misconceptionBackendDict.notes,
        misconceptionBackendDict.feedback);
    };

    Misconception.create = function(name, notes, feedback) {
      return new Misconception(name, notes, feedback);
    };

    return Misconception;
  }
]);