angular.module("ngAudioDemo", ['ngAudio', 'ui.router'])
    .config(function($urlRouterProvider, $stateProvider) {
        // $urlRouterProvider
        $stateProvider
            .state("home", {
                url: "/",
                templateUrl: "partial/home.html",
                controller: function($scope, ngAudio, songRemember) {
                    var url = 'audio/song1.mp3';
                    
                    if (songRemember[url]) {
                        $scope.audio = songRemember[url];
                    } else {
                        $scope.audio = ngAudio.load(url);
                        $scope.audio.volume = 0.8;
                        songRemember[url] = $scope.audio;

                        
                    }
                }
            })

        .state('docs', {
            url: "/docs",
            templateUrl: "partial/ngAudioDocs.html",
        })

        .state("audio", {
            url: "/audio",
            templateUrl: "partial/audioFullView.html",

        })

        .state('audio.detail', {
            url: "/:id",
            templateUrl: "partial/audioEditView.html",
            controller: function($stateParams, $scope, ngAudio,songRemember) {
                var url = $stateParams.id;

                if (songRemember[url]) {
                    $scope.audio = songRemember[url];
                } else {
                    $scope.audio = ngAudio.load(url);
                    $scope.audio.volume = 0.8;
                    songRemember[url] = $scope.audio;                    
                }
            }
        })



        $urlRouterProvider.otherwise('/');


    })
.value("songRemember",{})
    .controller('Demo', function($scope, ngAudio) {
        $scope.audios = [
            ngAudio.load('audio/song1.mp3'),
            ngAudio.load('audio/song2.mp3'),
            ngAudio.load('audio/song3.mp3'),
            ngAudio.load('audio/daniel_stern_robot_hitchiker.mp3'),
        ]
    })
