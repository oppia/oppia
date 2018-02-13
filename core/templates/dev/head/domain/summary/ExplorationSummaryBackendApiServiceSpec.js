describe('ExplorationSummaryBackendApiService', function() {
  var ExplorationSummaryBackendApiService = null;
  var $httpBackend = null;
  var $q=null;
  var ValidatorsService=null;
  var AlertsService=null;
  var EXPLORATION_SUMMARY_DATA_URL_TEMPLATE;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    ExplorationSummaryBackendApiService = $injector.get('ExplorationSummaryBackendApiService');
    $httpBackend=$injector.get('$httpBackend');
    $q=$injector.get('$q');
    EXPLORATION_SUMMARY_DATA_URL_TEMPLATE=$injector.get('EXPLORATION_SUMMARY_DATA_URL_TEMPLATE');
    AlertsService=$injector.get('AlertsService');
    ValidatorsService=$injector.get('ValidatorsService');
   
  }));
  

  it('loadPublicAndPrivateExplorationSummaries',function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var result=ExplorationSummaryBackendApiService .loadPublicAndPrivateExplorationSummaries(['']);
      expect(result).not.toBe();
      
       
    }  
  );
  
  it('HTTP GET',function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var t=$httpBackend.expectGET('/explorationsummarieshandler/data/').respond(function (status, data, headers, statusText){
          return [200,ExplorationSummaryBackendApiService .loadPublicAndPrivateExplorationSummaries([1,2,3])];
      });
      ExplorationSummaryBackendApiService .loadPublicAndPrivateExplorationSummaries([1,2,3]);
     
      
    }  
  );
  
 });
