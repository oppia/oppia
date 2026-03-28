# coding=utf-8
"""
The E-commerce Store Orders endpoint API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/orders/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Customers/Instance.json
"""
from __future__ import unicode_literals

import re

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.storeorderlines import StoreOrderLines


class StoreOrders(BaseApi):
    """
    Orders represent successful e-commerce transactions, and this data can be
    used to provide more detailed campaign reports, track sales, and
    personalize emails to your targeted consumers, and view other e-commerce
    data in your MailChimp account.

    .. note::
        If a financial_status or fulfillment_status value is provided when
        creating or updating an order, it will trigger a notification email if
        they have been designed and enabled in your account. The following sets
        of statuses trigger the following notification types:

        financial_status = 'paid' -> Order Invoice
        financial_status = 'pending' -> Order Confirmation
        financial_status = 'refunded' -> Refund Confirmation
        financial_status = 'cancelled' -> Cancellation Confirmation
        fulfillment_status = 'shipped' -> Shipping Confirmation

        The current list of notification types and triggers can be found at
        http://developer.mailchimp.com/documentation/mailchimp/guides/getting-started-with-ecommerce/#order-notifications
        and should be consulted in the event of any changes
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(StoreOrders, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.order_id = None
        self.lines = StoreOrderLines(self)


    def create(self, store_id, data):
        """
        Add a new order to a store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "customer": object*
            {
                "'id": string*
            },
            "curency_code": string*,
            "order_total": number*,
            "lines": array*
            [
                {
                    "id": string*,
                    "product_id": string*,
                    "product_variant_id": string*,
                    "quantity": integer*,
                    "price": number*
                }
            ]
        }
        """
        self.store_id = store_id
        if 'id' not in data:
            raise KeyError('The order must have an id')
        if 'customer' not in data:
            raise KeyError('The order must have a customer')
        if 'id' not in data['customer']:
            raise KeyError('The order customer must have an id')
        if 'currency_code' not in data:
            raise KeyError('The order must have a currency_code')
        if not re.match(r"^[A-Z]{3}$", data['currency_code']):
            raise ValueError('The currency_code must be a valid 3-letter ISO 4217 currency code')
        if 'order_total' not in data:
            raise KeyError('The order must have an order_total')
        if 'lines' not in data:
            raise KeyError('The order must have at least one order line')
        for line in data['lines']:
            if 'id' not in line:
                raise KeyError('Each order line must have an id')
            if 'product_id' not in line:
                raise KeyError('Each order line must have a product_id')
            if 'product_variant_id' not in line:
                raise KeyError('Each order line must have a product_variant_id')
            if 'quantity' not in line:
                raise KeyError('Each order line must have a quantity')
            if 'price' not in line:
                raise KeyError('Each order line must have a price')
        response = self._mc_client._post(url=self._build_path(store_id, 'orders'), data=data)
        if response is not None:
            self.order_id = response['id']
        else:
            self.order_id = None
        return response


    def all(self, store_id, get_all=False, **queryparams):
        """
        Get information about a store’s orders.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['customer_id'] = string
        """
        self.store_id = store_id
        self.order_id = None
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'orders'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'orders'), **queryparams)


    def get(self, store_id, order_id, **queryparams):
        """
        Get information about a specific order.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        self.order_id = order_id
        return self._mc_client._get(url=self._build_path(store_id, 'orders', order_id), **queryparams)


    def update(self, store_id, order_id, data):
        """
        Update a specific order.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        self.order_id = order_id
        return self._mc_client._patch(url=self._build_path(store_id, 'orders', order_id), data=data)


    def delete(self, store_id, order_id):
        """
        Delete an order.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        """
        self.store_id = store_id
        self.order_id = order_id
        return self._mc_client._delete(url=self._build_path(store_id, 'orders', order_id))
