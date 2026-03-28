# coding=utf-8
"""
The List Member Activity API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/activity/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Members/Activity/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_subscriber_hash


class ListMemberActivity(BaseApi):
    """
    Get details about subscribers’ recent activity.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListMemberActivity, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.subscriber_hash = None


    def all(self, list_id, subscriber_hash, **queryparams):
        """
        Get the last 50 events of a member’s activity on a specific list,
        including opens, clicks, and unsubscribes.

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
        return self._mc_client._get(url=self._build_path(list_id, 'members', subscriber_hash, 'activity'), **queryparams)
    
    def feed(self, list_id, subscriber_hash, **queryparams):
        """
        Get the last 10 events of a member’s activity on a specific list,
        including opens, clicks, and unsubscribes. 
        With count parameter, get as many past events as you would like.
        Returns many more fields not accessible by all endpoint.

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
        return self._mc_client._get(url=self._build_path(list_id, 'members', subscriber_hash, 'activity-feed'), **queryparams)

