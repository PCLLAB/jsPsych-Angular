/*
 * Example plugin template
 */

 jsPsych.plugins["free-recall"] = (function() {

	var plugin = {};

	plugin.trial = function(display_element, trial) {

		// set default values for parameters
		trial.instructions = trial.instructions || 'Please enter as many words as you can remember';

		// allow variables as functions
		// this allows any trial variable to be specified as a function
		// that will be evaluated when the trial runs. this allows users
		// to dynamically adjust the contents of a trial as a result
		// of other trials, among other uses. you can leave this out,
		// but in general it should be included
		trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

		display_element.load("lib/jsPsych/plugins/free-recall/template.html", function() {
			setup();
		});


		//Delay time in seconds before
		//continue can be clicked
		var startTime = Date.now();
		var delay = 360;
		var words = [];
		var timeout;
		var time = 0;
		var firstKeyWaiting = true;
		var firstKey = 0;

		var setup = function() {

			$('.free-recall-title').html(trial.instructions);

			$('.free-recall-continue').click(function() {
				 display_element.html("");
				 jsPsych.finishTrial({
				 	finish: "finished free-recall"
				 });
			 })

			$(".free-recall-input").keyup(function(e) {
				 if (e.which == 13) {
					var word = $(".free-recall-input").val();
					$(".free-recall-input").val("");

					if (word.length < 1) return;

					if (words.indexOf(word) < 0) {
						words.push(word);
						$(".free-recall-display").val($(".free-recall-display").val()+"\n"+word);
						$('.free-recall-display').scrollTop($('.free-recall-display')[0].scrollHeight);

						jsPsych.data.write({
							word: word,
							first_key: firstKey
						})
						//Push data here
					} else {
						$(".free-recall-error").remove();
						$("#free-recall-right").append("<p class='free-recall-error'>You can only enter a word once!</p>");
						clearTimeout(timeout);
						timeout = setTimeout(function() {
							$(".free-recall-error").remove();
						}, 1500);
					}
					
					firstKeyWaiting = true;
					$(".free-recall-input").focus();
				}
			});

			$(".free-recall-input").keypress(function(e) {
				 if (String.fromCharCode(e.which).match(/[^a-zA-Z\b]/)){
					e.preventDefault();
				}
				if (firstKeyWaiting) {
					firstKeyWaiting = false;
					firstKey = (Math.round(((Date.now() - startTime))));
				}
			});
		}
	};

	return plugin;
})();
