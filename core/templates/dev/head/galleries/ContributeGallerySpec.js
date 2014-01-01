describe('Gallery controller', function() {

  describe('ContributeGallery', function() {
    var scope, ctrl, $httpBackend;

    var geographyExploration = {
      can_clone: false,
      can_edit: false,
      data: {
        category: 'Geography',
        editors: [],
        id: '5',
        is_public: true,
        title: 'Landmarks'
      }
    };

    var myExploration = {
      can_clone: true,
      can_edit: true,
      data: {
        category: 'Personal',
        editors: [],
        id: '6',
        is_public: true,
        title: 'My Exploration'
      }
    };

    beforeEach(function() {
      module('ui.bootstrap');
    });

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/contributehandler/data').respond({
        allow_yaml_file_upload: false,
        categories: {
          Geography: [geographyExploration],
          Personal: [myExploration]
        }
      });
      scope = $rootScope.$new();
      ctrl = $controller(ContributeGallery, {$scope: scope, warningsData: null, oppiaRequestCreator: null});
    }));

    it('should show correct categories', function() {
      $httpBackend.flush();
      expect(scope.categories.Geography[0].data.title).toBe('Landmarks');
      expect(scope.categoryList).toEqual(['Geography', 'Personal']);
    });
  });
});
