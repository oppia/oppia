oppia.factory('ConceptCardObjectFactory', [
  function() {
    var ConceptCard = function(explanation, workedExamples) {
      this.explanation = explanation;
      this.workedExamples = workedExamples;
    };

    ConceptCard.prototype.toBackendDict = function() {
      return {
        explanation: this.explanation,
        worked_examples: this.workedExamples
      };
    };

    ConceptCard.createFromBackendDict = function(conceptCardBackendDict) {
      return new ConceptCard(
        conceptCardBackendDict.explanation,
        conceptCardBackendDict.worked_examples);
    };

    return ConceptCard;    
  }
]);