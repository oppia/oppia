describe('AnswerGroupObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.AnswerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');
  }));

  describe('.createSampleBackendDict', function() {
    it('is accepted by .createFromBackendDict', function() {
      var sampleBackendDict =
        this.AnswerGroupObjectFactory.createSampleBackendDict();

      var that = this;
      expect(function() {
        that.AnswerGroupObjectFactory.createFromBackendDict(sampleBackendDict);
      }).not.toThrow();
    });
  });
});


