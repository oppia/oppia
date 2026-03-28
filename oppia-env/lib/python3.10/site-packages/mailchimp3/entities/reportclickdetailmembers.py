# coding=utf-8
"""
The Click Detail Report Members API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/click-details/members/
Schema: https://api.mailchimp.com/schema/3.0/Reports/ClickDetails/Members/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_subscriber_hash


class ReportClickDetailMembers(BaseApi):
    """
    Get information about specific subscribers who clicked on links in a
    campaign.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportClickDetailMembers, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None
        self.link_id = None
        self.subscriber_hash = None


    def all(self, campaign_id, link_id, get_all=False, **queryparams):
        """
        Get information about list members who clicked on a specific link in a
        campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param link_id: The id for the link.
        :type link_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.campaign_id = campaign_id
        self.link_id = link_id
        self.subscriber_hash = None
        if get_all:
            return self._iterate(url=self._build_path(campaign_id, 'click-details', link_id, 'members'), **queryparams)
        else:
            return self._mc_client._get(
                url=self._build_path(campaign_id, 'click-details', link_id, 'members'),
                **queryparams
            )


    def get(self, campaign_id, link_id, subscriber_hash, **queryparams):
        """
        Get information about a specific subscriber who clicked a link in a
        specific campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param link_id: The id for the link.
        :type link_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.campaign_id = campaign_id
        self.link_id = link_id
        self.subscriber_hash = subscriber_hash
        return self._mc_client._get(
            url=self._build_path(campaign_id, 'click-details', link_id, 'members', subscriber_hash),
            **queryparams
        )
