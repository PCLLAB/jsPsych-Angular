/**
 * jsPsych plugin for showing animations and recording keyboard responses
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 */

/**
 * @name Animation
 * @param {array} stimuli - Each element of the array is a path to an image file.
 * @param {number=} [frame_time=250] - How long to display each image (in milliseconds).
 * @param {number=} [frame_isi=0] - If greater than 0, then a gap will be shown between each image in the sequence. This parameter specifies the length of the gap.
 * @param {number=} [sequence_reps=1] - How many times to show the entire sequence. There will be no gap (other than the gap specified by frame_isi) between repetitions.
 * @param {array=} [choices=[]] - This array contains the keys that the subject is allowed to press in order to respond to the stimulus. Keys can be specified as their numeric key code or as characters (e.g. 'a', 'q'). The default value of an empty array means that all keys will be accepted as valid responses.
 * @param {string=} [prompt=""] - This string can contain HTML markup. Any content here will be displayed below the stimulus. The intention is that it can be used to provide a reminder about the action the subject is supposed to take (e.g. which key to press).
 */
jsPsych.plugins.animation = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('animation', 'stimuli', 'image');

  plugin.trial = function(display_element, trial) {

    trial.frame_time = trial.frame_time || 250;
    trial.frame_isi = trial.frame_isi || 0;
    trial.sequence_reps = trial.sequence_reps || 1;
    trial.choices = trial.choices || [];
    trial.prompt = (typeof trial.prompt === 'undefined') ? "" : trial.prompt;

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var interval_time = trial.frame_time + trial.frame_isi;
    var animate_frame = -1;
    var reps = 0;
    var startTime = (new Date()).getTime();
    var animation_sequence = [];
    var responses = [];
    var current_stim = "";

    var animate_interval = setInterval(function() {
      var showImage = true;
      display_element.html(""); // clear everything
      animate_frame++;
      if (animate_frame == trial.stimuli.length) {
        animate_frame = 0;
        reps++;
        if (reps >= trial.sequence_reps) {
          endTrial();
          clearInterval(animate_interval);
          showImage = false;
        }
      }
      if (showImage) {
        show_next_frame();
      }
    }, interval_time);

    function show_next_frame() {
      // show image
      display_element.append($('<img>', {
        "src": trial.stimuli[animate_frame],
        "id": 'jspsych-animation-image'
      }));

      current_stim = trial.stimuli[animate_frame];

      // record when image was shown
      animation_sequence.push({
        "stimulus": current_stim,
        "time": (new Date()).getTime() - startTime
      });

      if (trial.prompt !== "") {
        display_element.append(trial.prompt);
      }

      if (trial.frame_isi > 0) {
        setTimeout(function() {
          $('#jspsych-animation-image').css('visibility', 'hidden');
          current_stim = 'blank';
          // record when blank image was shown
          animation_sequence.push({
            "stimulus": 'blank',
            "time": (new Date()).getTime() - startTime
          });
        }, trial.frame_time);
      }
    }

    var after_response = function(info) {

      responses.push({
        key_press: info.key,
        rt: info.rt,
        stimulus: current_stim
      });

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      $("#jspsych-animation-image").addClass('responded');
    }

    // hold the jspsych response listener object in memory
    // so that we can turn off the response collection when
    // the trial ends
    var response_listener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'date',
      persist: true,
      allow_held_key: false
    });

    function endTrial() {

      jsPsych.pluginAPI.cancelKeyboardResponse(response_listener);

      var trial_data = {
        "animation_sequence": JSON.stringify(animation_sequence),
        "responses": JSON.stringify(responses)
      };

      jsPsych.finishTrial(trial_data);
    }
  };

  return plugin;
})();
