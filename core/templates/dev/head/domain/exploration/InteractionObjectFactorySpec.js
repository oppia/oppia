describe('InteractionObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.InteractionObjectFactory = $injector.get('InteractionObjectFactory');
  }));

  describe('.createSampleBackendDict', function() {
    it('is accepted by .createFromBackendDict', function() {
      var sampleBackendDict =
        this.InteractionObjectFactory.createSampleBackendDict();

      var that = this;
      expect(function() {
        that.InteractionObjectFactory.createFromBackendDict(sampleBackendDict)
      }).not.toThrow();
    });
  });
});
