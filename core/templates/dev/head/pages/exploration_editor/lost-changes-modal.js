<div class="modal-header">
  <h3>Error With Exploration</h3>
</div>

<div class="modal-body">
  <p>
    Sorry! The following changes will be lost. This is likely due to
    editing an exploration without internet connection.
  </p>

  <p ng-show="hasLostChanges">
    The lost changes are displayed below. You may want to copy and
    paste these changes before discarding them.
  </p>

  <div class="oppia-lost-changes" ng-bind-html="lostChangesHtml">
  </div>
</div>

<div class="modal-footer">
  <button class="btn btn-default" ng-click="close()">Close</button>
</div>
