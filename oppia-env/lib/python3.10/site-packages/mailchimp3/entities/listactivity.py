# coding=utf-8
"""
The List Activity API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/activity/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Activity/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListActivity(BaseApi):
    """
    Get recent daily, aggregated activity stats for your list. For example,
    view unsubscribes, signups, total emails sent, opens, clicks, and more,
    for up to 180 days.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListActivity, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None


    def all(self, list_id, **queryparams):
        """
        Get up to the previous 180 days of daily detailed aggregated activity
        stats for a list, not including Automation activity.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        return self._mc_client._get(url=self._build_path(list_id, 'activity'), **queryparams)
