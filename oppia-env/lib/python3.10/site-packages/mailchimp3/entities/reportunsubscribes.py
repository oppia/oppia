# coding=utf-8
"""
The Unsubscribes Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/unsubscribed/
Schema: https://api.mailchimp.com/schema/3.0/Reports/Unsubs/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_subscriber_hash


class ReportUnsubscribes(BaseApi):
    """
    Get information about list members who unsubscribed from a specific campaign.
    """
    def __init__(self, *args, **kwargs):
        super(ReportUnsubscribes, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None
        self.subscriber_hash = None


    def all(self, campaign_id, get_all=False, **queryparams):
        """
        Get information about members who have unsubscribed from a specific
        campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.campaign_id = campaign_id
        self.subscriber_hash = None
        if get_all:
            return self._iterate(url=self._build_path(campaign_id, 'unsubscribed'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(campaign_id, 'unsubscribed'), **queryparams)


    def get(self, campaign_id, subscriber_hash, **queryparams):
        """
        Get information about a specific list member who unsubscribed from a
        campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.campaign_id = campaign_id
        self.subscriber_hash = subscriber_hash
        return self._mc_client._get(url=self._build_path(campaign_id, 'unsubscribed', subscriber_hash), **queryparams)
