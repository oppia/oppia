# coding=utf-8
"""
The Location Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/open-details/
Schema: https://api.mailchimp.com/schema/3.0/Reports/OpenDetails/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi

class OpenDetails(BaseApi):
    """
    Get a detailed report about any emails in a specific campaign that were opened by the recipient.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(OpenDetails, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None


    def all(self, campaign_id, get_all=False,  **queryparams):
        """
        Get detailed information about any campaign emails that were opened by a list member.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['since'] = str
        """
        self.campaign_id = campaign_id
        if get_all:
            return self._iterate(url=self._build_path(campaign_id, 'open-details'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(campaign_id, 'open-details'), **queryparams)


class ReportOpenDetails(OpenDetails):
    """
    Clone OpenDetails class as ReportOpenDetails for naming consistency
    """
    pass