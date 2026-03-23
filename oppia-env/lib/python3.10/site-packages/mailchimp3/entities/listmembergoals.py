# coding=utf-8
"""
The List Member Goals API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/goals/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Members/Goals/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_subscriber_hash


class ListMemberGoals(BaseApi):
    """
    Get information about recent goal events for a specific list member.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListMemberGoals, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.subscriber_hash = None


    def all(self, list_id, subscriber_hash, **queryparams):
        """
        Get the last 50 Goal events for a member on a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.list_id = list_id
        self.subscriber_hash = subscriber_hash
        return self._mc_client._get(url=self._build_path(list_id, 'members', subscriber_hash, 'goals'), **queryparams)
