# coding=utf-8
"""
The Automations API endpoint actions

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/automations/
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class AutomationActions(BaseApi):
    """
    Actions for the Automations endpoint.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(AutomationActions, self).__init__(*args, **kwargs)
        self.endpoint = 'automations'
        self.workflow_id = None


    # Paid feature
    def pause(self, workflow_id):
        """
        Pause all emails in a specific Automation workflow.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        return self._mc_client._post(url=self._build_path(workflow_id, 'actions/pause-all-emails'))


    # Paid feature
    def start(self, workflow_id):
        """
        Start all emails in an Automation workflow.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        return self._mc_client._post(url=self._build_path(workflow_id, 'actions/start-all-emails'))
