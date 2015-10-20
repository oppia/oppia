describe("retrieving threads service", function() {
  beforeEach(function() {
    module('oppia');
    module(function($provide) {
      $provide.value('explorationData', { explorationId: '12345' });
    });
  });

  var threadDataService, httpBackend;
  beforeEach(inject(function(_threadDataService_, $httpBackend) {
    threadDataService = _threadDataService_;
    httpBackend = $httpBackend;
  }));

  iit("should retrieve feeedback threads", function() {
    var mockThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: "test_author",
        state_name: null,
        has_suggestion: false,
        status: "open",
        subject: "example feedback",
        summary: null,
        threadId: "abc1",
      },
      {
        last_updated: 1441870501230.642,
        original_author_username: "test_author",
        state_name: null,
        has_suggestion: true,
        status: "open",
        subject: "example suggestion",
        summary: null,
        threadId: "abc2"
      }
    ];

    httpBackend.whenGET("/threadlisthandler/12345").respond({
      threads: mockThreads
    });

    var result;
    threadDataService.fetchThreads(function(){
      result = true;
    });
    httpBackend.flush();
    expect(result).toEqual(true);
    expect(threadDataService.data.threadList).toEqual(mockThreads);
  });
});
