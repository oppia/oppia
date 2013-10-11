describe('Gallery controller', function() {

  describe('GalleryCtrl', function() {
    var scope, ctrl, $httpBackend;

    var geographyExploration = {
      can_edit: false,
      can_fork: false,
      data: {
        category: 'Geography',
        editors: [],
        id: '5',
        image_id: null,
        is_public: true,
        title: 'Landmarks'
      }
    };

    var myExploration = {
      can_edit: true,
      can_fork: true,
      data: {
        category: 'Personal',
        editors: [],
        id: '6',
        image_id: null,
        is_public: true,
        title: 'My Exploration'
      }
    };

    beforeEach(function() {
      module('ui.bootstrap');
    });

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/gallery/data/').respond({
        allow_yaml_file_upload: false,
        categories: {
          Geography: [geographyExploration],
          Personal: [myExploration]
        }
      });
      scope = $rootScope.$new();
      ctrl = $controller(Gallery, {$scope: scope, warningsData: null});
    }));

    it('should create current URL', function() {
      expect(scope.currentUrl).toBe('http://localhost:9876/context.html');
    });

    it('should show correct categories', function() {
      $httpBackend.flush();
      expect(scope.categories.Geography[0].data.title).toBe('Landmarks');
      expect(scope.getCategoryList()).toEqual(['Geography', 'Personal', '?']);
    });
  });
});
