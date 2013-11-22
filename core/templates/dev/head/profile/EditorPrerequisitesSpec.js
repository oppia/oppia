describe('Editor prerequisites controller', function() {

  describe('EditorPrerequisitesCtrl', function() {
    var scope, ctrl, $httpBackend, mockWarningsData, urlParams;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(inject(function(_$httpBackend_, $rootScope) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/gallery/data/').respond({
        allow_yaml_file_upload: false
      });

      mockWarningsData = {
        addWarning: function(warning) {}
      };
      spyOn(mockWarningsData, 'addWarning');
    }));

    it('should show warning if user has not agreed to terms', function() {
      scope = {
        getUrlParams: function() {
          return {};
        },
      };
      ctrl = new EditorPrerequisites(scope, null, mockWarningsData, null);

      scope.submitPrerequisitesForm(false, null);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'In order to edit explorations on this site, you will need to agree ' +
        'to the terms of the license.');
    });

    it('should show username prompt if URL flag is set to false', function() {
      scope = {
        getUrlParams: function() {
          return {
            has_username: 'false',
	  };
        },
      };
      ctrl = new EditorPrerequisites(scope, null, mockWarningsData, null);
      expect(scope.hasUsername).toBe(false);
    });

    it('should not show username prompt if URL flag is set to true', function() {
      scope = {
        getUrlParams: function() {
          return {
            has_username: 'true',
          };    
        },
      };
      ctrl = new EditorPrerequisites(scope, null, mockWarningsData, null);
      expect(scope.hasUsername).toBe(true);
    });

    it('should show username prompt if URL flag is set to nonsense', function() {
      scope = {
        getUrlParams: function() {
          return {
            has_username: 'trueish',
          };    
        },
      };
      ctrl = new EditorPrerequisites(scope, null, mockWarningsData, null);
      expect(scope.hasUsername).toBe(false);
    });


    it('should show warning if no username provided', function($http) {
      scope = {
        getUrlParams: function() {
          return {};
        },
      };
      ctrl = new EditorPrerequisites(scope, null, mockWarningsData, null);

      scope.submitPrerequisitesForm(true, false);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Please choose a non-empty username.');
    });
  });
});
