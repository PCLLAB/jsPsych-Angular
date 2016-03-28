//PARAMETERS
//user_timing: true/false
//delay: 0-10000 ms
//max_attempts: 0-10, -1 for no limit
//recall_instruct: "text"
//word_list: [word1, word2, ... , wordN]
//max_recall_time: -1 (for none) or 0-100000 ms
jsPsych.plugins["multi-trial-learn"] = (function() {

	var plugin = {};

	plugin.trial = function(display_element, trial) {



		// set default values for parameters
		trial.study_instruct = trial.study_instruct || 'Study the following words that will appear on the page'
		trial.recall_instruct = trial.recall_instruct || 'Please enter as many words as you can remember';
		trial.user_timing = trial.user_timing || false;
		trial.max_attempts = trial.max_attempts || -1;
		trial.delay = trial.delay || 2000;
		trial.max_recall_time = trial.max_recall_time || -1;


		var temp_word_list = trial.word_list;
		var attempt = 1;
		// allow variables as functions
		// this allows any trial variable to be specified as a function
		// that will be evaluated when the trial runs. this allows users
		// to dynamically adjust the contents of a trial as a result
		// of other trials, among other uses. you can leave this out,
		// but in general it should be included
		trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

		var study = function() {

			function scrambleWords(){
				for (var i = temp_word_list.length - 1; i > 0; i--) {
					var j = Math.floor(Math.random() * (i + 1));
					var temp = temp_word_list[i];
					temp_word_list[i] = temp_word_list[j];
					temp_word_list[j] = temp;
				}
			}

			var startTime = Date.now();
			var keyPresses = [];
			var pointer = 0;
			var firstKey = 0;
			display_element.load("plugins/multi-trial-learn/template_study.html", function() {
				setup_study();
			});

			var setup_study = function() {
				scrambleWords();
				if(false){//attempt > 1) {
					startTime = Date.now();
					nextWord();
				} else {
					$('.multi-trial-learn-title').html(trial.study_instruct);
					$('.multi-trial-learn-continue').click(function() {
						startTime = Date.now();
						nextWord();
					});					
				}
			}

			var nextWord = function() {
				display_element.html("");
				setTimeout(function() {
					display_element.load("plugins/multi-trial-learn/template_study.html", function() {
						$(".multi-trial-learn-title").html(temp_word_list[pointer]);
						pointer++;
							if(trial.user_timing)  { //if button exists from user
								$('.multi-trial-learn-continue').click(function() {
									firstKey = (Math.round(((Date.now() - startTime))));
									jsPsych.data.write({
										type: "study_multi_trial",
										word: temp_word_list[pointer - 1],
										first_key: firstKey
									})
									if(pointer >= temp_word_list.length) {
										display_element.html("");
										setTimeout(recall, 800);
									} else {
										nextWord();
									}
								});
							} else {
								$('.multi-trial-learn-continue').remove();
								setTimeout(function() {
									if((pointer) >= temp_word_list.length) {
										display_element.html("");
										setTimeout(recall, 800);
									} else {
										nextWord();
									}
								},trial.delay);
							}
						});		
				},800);

			}


		}

		var recall = function() {

			display_element.load("plugins/multi-trial-learn/template_recall.html", function() {
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
			var tempRecall = [];
			var setup = function(){

				function recall_end() {
					clearTimeout(maxRecallTime);
					if(temp_word_list.length == 0 || attempt == trial.max_attempts) {
						jsPsych.data.write({
							attempts: attempt
						})
						console.log("Finished trial");
						jsPsych.finishTrial({
							finish: "finished multi-trial-learn"
						});						
					} else {
						attempt++;
						study();
					}
				}
				var maxRecallTime;
				if(trial.max_recall_time != -1) {
					maxRecallTime = setTimeout(function() {
						recall_end();
					},trial.max_recall_time);
				}

				$('.multi-trial-learn-title').html(trial.recall_instruct);

				$('.multi-trial-learn-continue').click(function() {
					display_element.html("");
					var new_word_list = [];
					for(i = 0; i < temp_word_list.length; i++) {
						var index = tempRecall.indexOf(temp_word_list[i]);
						if(index == -1) {
							new_word_list.push(temp_word_list[i]);
						}
					}
					temp_word_list = new_word_list;
					recall_end();

				})

				$(".multi-trial-learn-input").keyup(function(e) {
					if (e.which == 13) {
						var word = $(".multi-trial-learn-input").val();
						$(".multi-trial-learn-input").val("");

						if (word.length < 1) return;

						if (words.indexOf(word) < 0) {
							words.push(word);
							$(".multi-trial-learn-display").val($(".multi-trial-learn-display").val()+"\n"+word);
							$('.multi-trial-learn-display').scrollTop($('.multi-trial-learn-display')[0].scrollHeight);
							tempRecall.push(word);
							jsPsych.data.write({
								word: word,
								first_key: firstKey
							})
							//Push data here
						} else {
							$(".multi-trial-learn-error").remove();
							$("#multi-trial-learn-right").append("<p class='multi-trial-learn-error'>You can only enter a word once!</p>");
							clearTimeout(timeout);
							timeout = setTimeout(function() {
								$(".multi-trial-learn-error").remove();
							}, 1500);
						}
						
						firstKeyWaiting = true;
						$(".multi-trial-learn-input").focus();
					}
				});

				$(".multi-trial-learn-input").keypress(function(e) {
					if (String.fromCharCode(e.which).match(/[^a-zA-Z\b]/)){
						e.preventDefault();
					}
					if (firstKeyWaiting) {
						firstKeyWaiting = false;
						firstKey = (Math.round(((Date.now() - startTime))));
					}
				});
			}
		}


		study();

	};
	return plugin;
})();
