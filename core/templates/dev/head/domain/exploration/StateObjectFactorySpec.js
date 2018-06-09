describe('StateObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.StateObjectFactory = $injector.get('StateObjectFactory');
  }));

  describe('.createSampleBackendDict', function() {
    it('is accepted by .createFromBackendDict', function() {
      var sampleBackendDict = this.StateObjectFactory.createSampleBackendDict();

      var that = this;
      expect(function() {
        that.StateObjectFactory.createFromBackendDict(
          'Introduction', sampleBackendDict)
      }).not.toThrow();
    });
  });
});

