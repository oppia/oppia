# coding=utf-8
"""
The E-commerce Store Orders endpoint API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/orders/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Customers/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class StoreOrderLines(BaseApi):
    """
    Each Order contains one or more Order Lines, which represent a specific
    Product Variant that a Customer purchases.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(StoreOrderLines, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.order_id = None
        self.line_id = None


    def create(self, store_id, order_id, data):
        """
        Add a new line item to an existing order.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "product_id": string*,
            "product_variant_id": string*,
            "quantity": integer*,
            "price": number*
        }
        """
        self.store_id = store_id
        self.order_id = order_id
        if 'id' not in data:
            raise KeyError('The order line must have an id')
        if 'product_id' not in data:
            raise KeyError('The order line must have a product_id')
        if 'product_variant_id' not in data:
            raise KeyError('The order line must have a product_variant_id')
        if 'quantity' not in data:
            raise KeyError('The order line must have a quantity')
        if 'price' not in data:
            raise KeyError('The order line must have a price')
        response = self._mc_client._post(url=self._build_path(store_id, 'orders', order_id, 'lines'))
        if response is not None:
            self.line_id = response['id']
        else:
            self.line_id = None
        return response


    def all(self, store_id, order_id, get_all=False, **queryparams):
        """
        Get information about an order’s line items.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id = store_id
        self.order_id = order_id
        self.line_id = None
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'orders', order_id, 'lines'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'orders', order_id, 'lines'), **queryparams)


    def get(self, store_id, order_id, line_id, **queryparams):
        """
        Get information about a specific order line item.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param line_id: The id for the line item of a cart.
        :type line_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        self.order_id = order_id
        self.line_id = line_id
        return self._mc_client._get(url=self._build_path(store_id, 'orders', order_id, 'lines', line_id), **queryparams)


    def update(self, store_id, order_id, line_id, data):
        """
        Update a specific order line item.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param line_id: The id for the line item of a cart.
        :type line_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        self.order_id = order_id
        self.line_id = line_id
        return self._mc_client._patch(url=self._build_path(store_id, 'orders', order_id, 'lines', line_id), data=data)


    def delete(self, store_id, order_id, line_id):
        """
        Delete a specific order line item.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param order_id: The id for the order in a store.
        :type order_id: :py:class:`str`
        :param line_id: The id for the line item of a cart.
        :type line_id: :py:class:`str`
        """
        self.store_id = store_id
        self.order_id = order_id
        self.line_id = line_id
        return self._mc_client._delete(url=self._build_path(store_id, 'orders', order_id, 'lines', line_id))
