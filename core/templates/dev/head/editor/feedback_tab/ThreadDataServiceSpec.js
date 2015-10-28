describe('retrieving threads service', function() {
  var expId = '12345';
  beforeEach(function() {
    module('oppia');
    module(function($provide) {
      $provide.value('explorationData', { explorationId: expId });
    });
  });

  var threadDataService, httpBackend;
  beforeEach(inject(function(_threadDataService_, $httpBackend) {
    threadDataService = _threadDataService_;
    httpBackend = $httpBackend;
  }));

  it('should retrieve feeedback threads', function() {
    var mockFeedbackThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example feedback',
        summary: null,
        threadId: 'abc1',
        suggestionId: ''
      },
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example suggestion',
        summary: null,
        threadId: 'abc2',
        suggestionId: ''
      }
    ];

    var mockOpenSuggestionThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example suggestion',
        summary: null,
        threadId: 'abc3',
        suggestionId: '1'
      },
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_author',
        state_name: null,
        status: 'open',
        subject: 'example suggestion',
        summary: null,
        threadId: 'abc4',
        suggestionId: '2'
      }
    ];

    httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      threads: mockFeedbackThreads
    });

    httpBackend.whenGET('/suggestionlisthandler/' + expId + '?type=open').respond({
      threads: mockOpenSuggestionThreads
    });

    threadDataService.fetchThreads();
    httpBackend.flush();

    for (var i=0; i < mockFeedbackThreads.length; i++) {
      expect(threadDataService.data.threadList).toContain(mockFeedbackThreads[i]);
    }
    for (var i=0; i < mockOpenSuggestionThreads.length; i++) {
      expect(threadDataService.data.threadList).toContain(mockOpenSuggestionThreads[i]);
    }
  });
});
