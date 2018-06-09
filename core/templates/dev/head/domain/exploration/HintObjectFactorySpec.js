describe('HintObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.HintObjectFactory = $injector.get('HintObjectFactory');
  }));

  describe('.createSampleBackendDict', function() {
    it('is accepted by .createFromBackendDict', function() {
      var sampleBackendDict = this.HintObjectFactory.createSampleBackendDict();

      var that = this;
      expect(function() {
        that.HintObjectFactory.createFromBackendDict(sampleBackendDict);
      }).not.toThrow();
    });
  });
});



