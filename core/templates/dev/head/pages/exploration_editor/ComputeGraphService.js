oppia.factory('ComputeGraphService', [
  'INTERACTION_SPECS', function(INTERACTION_SPECS) {
    var _computeGraphData = function(initStateId, states) {
      var nodes = {};
      var links = [];
      var finalStateIds = states.getFinalStateNames();

      states.getStateNames().forEach(function(stateName) {
        var interaction = states.getState(stateName).interaction;
        nodes[stateName] = stateName;
        if (interaction.id) {
          var groups = interaction.answerGroups;
          for (var h = 0; h < groups.length; h++) {
            links.push({
              source: stateName,
              target: groups[h].outcome.dest,
            });
          }

          if (interaction.defaultOutcome) {
            links.push({
              source: stateName,
              target: interaction.defaultOutcome.dest,
            });
          }
        }
      });

      return {
        finalStateIds: finalStateIds,
        initStateId: initStateId,
        links: links,
        nodes: nodes
      };
    };

    return {
      compute: function(initStateId, states) {
        return _computeGraphData(initStateId, states);
      }
    };
  }
]);

