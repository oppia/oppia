describe('Editor prerequisites controller', function() {

  describe('EditorPrerequisitesCtrl', function() {
    var scope, ctrl, $httpBackend, rootScope, mockWarningsData, urlParams;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(inject(function(_$httpBackend_, $http, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/editor_prerequisites_handler/data/').respond({
        username: 'myUsername',
        has_agreed_to_terms: false
      });
      rootScope = $rootScope;

      mockWarningsData = {
        addWarning: function(warning) {}
      };
      spyOn(mockWarningsData, 'addWarning');

      scope = {
        getUrlParams: function() {
          return {return_url: 'return_url'};
        }
      };

      ctrl = $controller(EditorPrerequisites, {
        $scope: scope,
        $http: $http,
        $rootScope: rootScope,
        warningsData: mockWarningsData,
        oppiaRequestCreator: null
      });
    }));

    it('should show warning if user has not agreed to terms', function() {
      scope.submitPrerequisitesForm(false, null);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'In order to edit explorations on this site, you will need to agree ' +
        'to the site terms.');
    });

    it('should get data correctly from the server', function() {
      $httpBackend.flush();
      expect(scope.username).toBe('myUsername');
      expect(scope.agreedToTerms).toBe(false);
    });

    it('should show a loading message until the data is retrieved', function() {
      expect(rootScope.loadingMessage).toBe('Loading');
      $httpBackend.flush();
      expect(rootScope.loadingMessage).toBeFalsy();
    });

    it('should show warning if terms are not agreed to', function() {
      scope.submitPrerequisitesForm(false, '');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'In order to edit explorations on this site, you will need to ' +
        'agree to the site terms.');
    });

    it('should show warning if no username provided', function($http) {
      scope.submitPrerequisitesForm(true, '');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Please choose a non-empty username.');

      scope.submitPrerequisitesForm(true, false);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Please choose a non-empty username.');
    });
  });
});
