// These console messages need to be at (or above) the info level so that 
// protractor will notice them.

window.OPPIA_PLAYER.onExplorationLoadedPostHook = function(iframeNode) {
  console.info('Embedding test: Exploration loaded');
};

window.OPPIA_PLAYER.onStateTransitionPostHook = function(
    iframeNode, oldStateName, jsonAnswer, newStateName) {
  console.info(
    'Embedding test: Transitioned from state ' + oldStateName + 
    ' via answer ' + jsonAnswer + ' to state ' + newStateName);
};

window.OPPIA_PLAYER.onExplorationResetPostHook = function(iframeNode, stateName) {
  console.info('Embedding test: Restarted from state ' + stateName);
};

window.OPPIA_PLAYER.onExplorationCompletedPostHook = function(iframeNode) {
  console.info('Embedding test: Exploration completed');
};
