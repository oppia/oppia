describe('ExplorationSummaryBackendApiService', function() {
  var Exploration = null;
  var $httpBackend = null;
  var $q = null;
  var ValidatorsService = null;
  var AlertsService = null;
 

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    Exploration = $injector.get('ExplorationSummaryBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    AlertsService = $injector.get('AlertsService');
    ValidatorsService = $injector.get('ValidatorsService');
  }));
  

  it('loadPublicAndPrivateExplorationSummaries',function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var result = Exploration.loadPublicAndPrivateExplorationSummaries(['']);
    expect(result).not.toBe();
  }  
  );
  
  it('HTTP GET',function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var t = $httpBackend.expectGET('/explorationsummarieshandler/data/')
            .respond(function (status, data, headers, statusText){
              return [200,
                      Exploration
                        .loadPublicAndPrivateExplorationSummaries([1,2,3])];
            });
    Exploration.loadPublicAndPrivateExplorationSummaries([1,2,3]);
  }  
  );
});
