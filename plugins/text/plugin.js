/* jspsych-text.js
 * Josh de Leeuw
 *
 * This plugin displays text (including HTML formatted strings) during the experiment.
 * Use it to show instructions, provide performance feedback, etc...
 *
 * documentation: docs.jspsych.org
 *
 *
 */

/**
 * @name Text
 * @param {string} text - A string containing HTML formatted text (no HTML code is necessary, but it is allowed).
 * @param {array|string=} [cont_key=[]] - This array contains the keys that the subject is allowed to press in order to advance to the next trial. Keys can be specified as their numeric key code or as characters (e.g. 'a', 'q'). The default value of an empty array means that all keys will be accepted as valid responses. If the value of 'mouse' is used, then clicking the mouse will advance to the next trial.
 */
jsPsych.plugins.text = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    trial.cont_key = trial.cont_key || [];

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // set the HTML of the display target to replaced_text.
    display_element.html(trial.text);

    var after_response = function(info) {

      display_element.html(''); // clear the display

      var trialdata = {
        "rt": info.rt,
        "key_press": info.key
      }

      jsPsych.finishTrial(trialdata);

    };

    var mouse_listener = function(e) {

      var rt = (new Date()).getTime() - start_time;

      display_element.unbind('click', mouse_listener);

      after_response({
        key: 'mouse',
        rt: rt
      });

    };

    // check if key is 'mouse'
    if (trial.cont_key == 'mouse') {
      display_element.click(mouse_listener);
      var start_time = (new Date()).getTime();
    } else {
      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.cont_key,
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });
    }

  };

  return plugin;
})();
