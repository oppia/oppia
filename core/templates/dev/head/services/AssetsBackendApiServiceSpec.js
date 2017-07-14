describe('Assets backend API service', function() {
  var AssetsBackendApiService = null;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    AssetsBackendApiService = $injector.get('AssetsBackendApiService');
  }));
})