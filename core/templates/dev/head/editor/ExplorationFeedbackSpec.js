describe('ExplorationFeedback controller', function(){
  beforeEach(module('oppia'));

  describe('ExplorationFeedback', function() {
    var scope, ctrl, $httpBackend, mockExplorationData;

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

    var mockMessages = [
      {
        exploration_id: 'explorationid',
        author_username: 'test_author',
        message_id: '0',
        text: 'text message',
        updated_status: 'Open',
        updated_subject: 'test subject'
      },
      {
        exploration_id: 'explorationid',
        author_username: 'test_author',
        message_id: '1',
        text: 'test response',
        updated_status: null,
        updated_subject: null
      },
    ];

    var mockSuggestion = {
      author_id: 'test_author',
      id: 'abc2',
      exp_id: 'exploration_id',
      exp_version: '0',
      state_name: 'state0',
      status: 'NEW',
      state_content: {
        'old_content': 'original exploration content',
        'new_content': 'suggested exploration content'
      }
    }

    beforeEach(inject(function($rootScope, $controller, $injector) {
      scope = $rootScope.$new();
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET','/threadlisthandler/12345').respond({
        threads: mockThreads
      })
      $httpBackend.when('GET', '/threadhandler/12345/abc2').respond({
        messages: mockMessages
      });
      $httpBackend.when('GET', 'suggestionhandler/12345/abc2')
        .respond(mockSuggestion);
      ctrl = $controller('ExplorationFeedback', {
        $scope: scope,
        explorationData: {
          explorationId: '12345'
        }
      });
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should retrieve threads', function() {
      $httpBackend.expectGET('/threadlisthandler/12345');
      scope._getThreadList();
      $httpBackend.flush();
      $httpBackend.expectGET('/threadhandler/12345/abc2');
      scope.setCurrentThread('abc2');
      $httpBackend.flush();
      expect(scope.threads).toEqual(mockThreads);
      expect(scope.currentThreadMessages).toEqual(mockMessages);
    });

    it('should retrieve suggestions', function() {
      $httpBackend.expectGET('/suggestionhandler/12345/abc2');
      scope.getSuggestion();
      $httpBackend.flush();
      expect(scope.suggestion).toEqual(mockSuggestion);
    });
  });
});
