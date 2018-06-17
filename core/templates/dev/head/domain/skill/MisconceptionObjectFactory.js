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

    return Misconception;
  }
]);