describe('taToolFunctions', function(){
	var taToolFunctions;

	beforeEach(module('textAngular'));

	beforeEach(inject(function(_taToolFunctions_){
		taToolFunctions = _taToolFunctions_;
	}));

	describe('extractYoutubeVideoId', function(){

		it('should extract video id from youtube link variations', function(){
			youtubeVideUrlVariations = [
				'http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index',
				'http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/0zM3nApSvMg',
				'http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0',
				'http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s',
				'http://www.youtube.com/embed/0zM3nApSvMg?rel=0',
				'http://www.youtube.com/watch?v=0zM3nApSvMg',
				'http://youtu.be/0zM3nApSvMg',
				'https://www.youtube-nocookie.com/embed/0zM3nApSvMg'
			];

			angular.forEach(youtubeVideUrlVariations, function(youtubeVideUrl) {
				expect(taToolFunctions.extractYoutubeVideoId(youtubeVideUrl)).toBe('0zM3nApSvMg');
			});
		});
		it('should not extract video id from invalid youtube link variations', function(){
			invalidYoutubeVideUrlVariations = [
				'http://www.youtube.com/watch?v=0zM3nApS&feature=feedrec_grec_index',
				'http://www.youtube.com/user/elsonVEVO#p/a/u/1/8U-VIH_o',
				'http://www.youtube.com/v/0zM3nApS?fs=1&amp;hl=en_US&amp;rel=0',
				'http://www.youtube.com/watch?v=0zApSvMg#t=0m10s',
				'http://www.youtube.com/embed/0zM3Mg?rel=0',
				'http://www.youtube.com/watch?v=0znApSvMg',
				'http://youtu.be/0zM3nAvMg',
				'https://www.youtube-nocookie.com/embed/0zM3nAvMg'
			];

			angular.forEach(invalidYoutubeVideUrlVariations, function(youtubeVideUrl) {
				expect(taToolFunctions.extractYoutubeVideoId(youtubeVideUrl)).toBeNull();
			});
		});
	});
});
