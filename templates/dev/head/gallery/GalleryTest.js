describe('Gallery controller', function() {

  describe('GalleryCtrl', function() {
    var scope, ctrl, $httpBackend;

    var geographyExploration = {
      can_edit: false,
      can_fork: false,
      data: {
        category: 'Geography',
        datasets: [],
        editors: [],
        id: '5',
        image_id: null,
        is_public: true,
        parameters: [],
        title: 'Landmarks'
      }
    };

    var myExploration = {
      can_edit: true,
      can_fork: true,
      data: {
        category: 'Personal',
        datasets: [],
        editors: [],
        id: '6',
        image_id: null,
        is_public: true,
        parameters: [],
        title: 'My Exploration'
      }
    };

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

    it('should show all explorations by default', function() {
      expect(scope.showMyExplorations).toBe(false);

      expect(scope.getToggleText()).toBe('Show editable explorations ▸');
      expect(scope.getHeadingText()).toBe('All Explorations');
      expect(scope.canViewExploration(geographyExploration)).toBe(true);
      expect(scope.canViewExploration(myExploration)).toBe(true);
    });

    it('should update when the "show exploration" preference changes', function() {
      expect(scope.showMyExplorations).toBe(false);

      scope.toggleExplorationView();

      expect(scope.getToggleText()).toBe('◂ Show all explorations');
      expect(scope.getHeadingText()).toBe('Explorations you can edit');
      expect(scope.canViewExploration(geographyExploration)).toBe(false);
      expect(scope.canViewExploration(myExploration)).toBe(true);
    });

    it('should create current URL', function() {
      expect(scope.currentUrl).toBe('http://localhost:9876/context.html');
    });

    it('should show correct categories', function() {
      $httpBackend.flush();
      expect(scope.categories.Geography[0].data.title).toBe('Landmarks');
      expect(scope.getCategoryList()).toEqual(['Geography', 'Personal', '?']);
    });

    it('should check that the current URL is not the demo server', function() {
      expect(scope.isDemoServer()).toBe(false);
    });
  });
});
