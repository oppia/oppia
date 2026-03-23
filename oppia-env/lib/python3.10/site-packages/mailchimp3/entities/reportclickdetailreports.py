# coding=utf-8
"""
The Click Details Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/click-details/
Schema: https://api.mailchimp.com/schema/3.0/Reports/ClickDetails/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.reportclickdetailmembers import ReportClickDetailMembers


class ReportClickDetailReports(BaseApi):
    """
    Get detailed information about links clicked in campaigns.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportClickDetailReports, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None
        self.link_id = None
        self.members = ReportClickDetailMembers(self)


    def all(self, campaign_id, get_all=False, **queryparams):
        """
        Get information about clicks on specific links in your MailChimp
        campaigns.

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
        self.link_id = None
        if get_all:
            return self._iterate(url=self._build_path(campaign_id, 'click-details'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(campaign_id, 'click-details'), **queryparams)


    def get(self, campaign_id, link_id, **queryparams):
        """
        Get click details for a specific link in a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param link_id: The id for the link.
        :type link_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        self.link_id = link_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'click-details', link_id), **queryparams)
