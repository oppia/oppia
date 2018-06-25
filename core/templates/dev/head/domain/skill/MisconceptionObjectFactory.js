oppia.factory('MisconceptionObjectFactory', [
  function() {
    var Misconception = function(id, name, notes, feedback) {
      this.id = id;
      this.name = name;
      this.notes = notes;
      this.feedback = feedback;
    };

    Misconception.prototype.toBackendDict = function() {
      return {
        id: this.id,
        name: this.name,
        notes: this.notes,
        feedback: this.feedback
      };
    };

    Misconception.createFromBackendDict = function(misconceptionBackendDict) {
      return new Misconception(
        misconceptionBackendDict.id,
        misconceptionBackendDict.name,
        misconceptionBackendDict.notes,
        misconceptionBackendDict.feedback);
    };

    Misconception.create = function(id, name, notes, feedback) {
      return new Misconception(id, name, notes, feedback);
    };

    return Misconception;
  }
]);