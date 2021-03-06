var
	request = require('request'),
	querystring = require('querystring');

function setOptions(options, values) {
	if (values.length === 0 && typeof values[0] !== 'object') {
		return;
	}
	for (var key in values[0]) {
		if (options.hasOwnProperty(key)) {
			options[key] = values[0][key];
		}
	}
}

function createSettersGetters(obj, options) {
	for (var key in options) {
		if (options.hasOwnProperty(key)) {
			obj[key] = (function(key) {
				return function () {
					if (arguments.length === 0) {
						return options[key];
					}
					options[key] = arguments[0];
					return obj;
				}
			}(key));
		}
	}
}

function Payson(agentId, apiPassword, applicationId) {
	var payson = this;
	var apiUrl = 'https://api.payson.se/1.0/';
	var payForwardUrl = 'https://www.payson.se/paysecure/?token=';

	if (typeof apiPassword === 'undefined') {
		agentId = '1';
		apiPassword = 'fddb19ac-7470-42b6-a91d-072cb1495f0a';
		apiUrl = 'https://test-api.payson.se/1.0/';
		payForwardUrl = 'https://test-www.payson.se/paysecure/?token=';
	}

	payson.Payment = function () {
		var
			payment = this,
			options = {
				returnUrl: '',
				cancelUrl: '',
				memo: '',
				ipnNotificationUrl: '',
				localeCode: 'EN',
				currencyCode: 'EUR',
				creditCardFunding: true,
				bankFunding: false,
				invoiceFunding: false,
				senderPaysFee: false, // Default: PRIMARYRECEIVER pays fees
				invoiceFee: 0,
				custom: '',
				trackingId: '',
				guaranteeOffered: undefined,
				senderEmail: '',
				senderFirstName: '',
				senderLastName: ''
			},
			items = [],
			receivers = []
			token = null;

		setOptions (options, arguments);
		createSettersGetters(payment, options);

		payment.Item = function () {
			var
				item = this,
				options = {
					description: '',
					sku: '',
					quantity: 0,
					unitPrice: 0,
					taxPercentage: 0
				};
			items.push(item); // Add this item to items list.
			setOptions (options, arguments);
			createSettersGetters(item, options);
		};

		payment.Receiver = function () {
			var
				receiver = this,
				options = {
					email: '',
					amount: 0,
					firstName: '',
					lastName: ''
				};
			receivers.push(receiver);
			setOptions (options, arguments);
			createSettersGetters(receiver, options);
		};

		payment.getPaysonUrl = function(callback) {

			if (typeof callback === 'undefined') callback = function() { };

			if (token !== null && typeof callback !== 'undefined') {
				return callback(null, 'https://www.payson.se/paySecure/?token=' + token);
			}

			var postVars = options;

			// Validate (and re-format) invoice fundings:
			if (options.invoiceFunding) {
				postVars['fundingList.fundingConstraint(0).constraint'] = 'INVOICE';
			} else {
				if (options.creditCardFunding) {
					postVars['fundingList.fundingConstraint(0).constraint'] = 'CREDITCARD';
					if (options.bankFunding) {
						postVars['fundingList.fundingConstraint(1).constraint'] = 'BANK';
					}
				} else {
					if (options.bankFunding) {
						postVars['fundingList.fundingConstraint(0).constraint'] = 'BANK';
					}
				}
			}
			delete (postVars['invoiceFunding']);
			delete (postVars['creditCardFunding']);
			delete (postVars['bankFunding']);

			// Re-format who will pay the fees:
			if (options.senderPaysFee) {
				postVars['feesPayer'] = 'SENDER';
			} else {
				postVars['feesPayer'] = 'PRIMARYRECEIVER';
			}
			delete (postVars['senderPaysFee']);
			
			// Guarantee offered format:
			if (typeof options.guaranteeOffered === 'undefined') {
				postVars['guaranteeOffered'] = 'OPTIONAL';
			} else {
				if (options.guaranteeOffered) {
					postVars['guaranteeOffered'] = 'REQUIRED';
				} else {
					postVars['guaranteeOffered'] = 'NO';
				}
			}

			if (receivers.length === 1) {
				postVars['receiverList.receiver.email'] = receivers[0].email();
				postVars['receiverList.receiver.amount'] = receivers[0].amount();
				postVars['receiverList.receiver.firstName'] = receivers[0].firstName();
				postVars['receiverList.receiver.lastName'] = receivers[0].lastName();
			} else if (receivers.length > 1) {
				for (var i = 0; i < receivers.length; i++) {
					postVars['receiverList.receiver(' + i + ').email'] = receivers[i].email();
					if (i === 0) {
						postVars['receiverList.receiver(' + i + ').primary'] = 'true';
					} else {
						postVars['receiverList.receiver(' + i + ').primary'] = 'false';
					}
					postVars['receiverList.receiver(' + i + ').amount'] = receivers[i].amount();
					postVars['receiverList.receiver(' + i + ').firstName'] = receivers[i].firstName();
					postVars['receiverList.receiver(' + i + ').lastName'] = receivers[i].lastName();
				}
			}

			for (var i = 0; i < items.length; i++) {
				postVars['orderItemList.orderItem(' + i + ').description'] = items[i].description();
				postVars['orderItemList.orderItem(' + i + ').sku'] = items[i].sku();
				postVars['orderItemList.orderItem(' + i + ').quantity'] = items[i].quantity();
				postVars['orderItemList.orderItem(' + i + ').unitPrice'] = items[i].unitPrice();
				postVars['orderItemList.orderItem(' + i + ').taxPercentage'] = items[i].taxPercentage();
			}

			console.dir(postVars);

			request.post({
				url: apiUrl + 'Pay/',
				method: 'POST',
				form: postVars,
				headers: {
					'PAYSON-SECURITY-USERID': agentId,
					'PAYSON-SECURITY-PASSWORD': apiPassword
				}
			}, function (err, response, body) {
				if (err) return callback(err);
				if (response.statusCode != 200) return callback(new Error('Payson api status code: ' + response.statusCode));
				var data = querystring.parse(body);
				console.dir(data);

				if (data['responseEnvelope.ack'] !== 'SUCCESS') {
					if (typeof data['errorList.error(0).message'] !== 'undefined') {
						var errmsg = data['errorList.error(0).message'];
						if (typeof data['errorList.error(0).parameter'] !== 'undefined') {
							errmsg += ': ' + data['errorList.error(0).parameter'];
						}
						return callback(new Error(errmsg));
					} else {
						return callback(new Error('Undefined error @ Payson'));
					}
				}

				if (typeof data['TOKEN'] === 'undefined') {
					return callback(new Error('Did not get TOKEN from Payson API.'));
				}

				callback(null, payForwardUrl + data['TOKEN']);
			});
			// if (data['responseEnvelope.ack'] === 'SUCCESS') {
			//   token = data['TOKEN']... typ;
			//   callback(null, 'https://www.payson.se/paySecure/?token=' + token);
			// }
		};

		payment.getDetails = function(callback) {

			ajax({ token: token }, function (err, data) {
				if (err) {
					return callback(err);
				}
				if (data['responseEnvelope.ack'] !== 'SUCCESS') {
					return callback(new Error('Failed. :('));
				}
				callback(null, data);
			});

		};

		function updatePayment(action, callback) {
			ajax({ token: token, action: action }, function (err, data) {
				if (err) {
					return callback(err);
				}
				if (data['responseEnvelope.ack'] !== 'SUCCESS') {
					return callback(new Error('Nah didnt work.'));
				}
			});
			
		}
		payment.cancelOrder = function (callback) {
			if (!options.invoiceFunding) {
				return callback(new Error('Can only cancel invoice payments.'));
			}
			updatePayment('CANCELORDER', callback);
		};
		payment.shipOrder = function (callback) {
			if (!options.invoiceFunding) {
				return callback(new Error('Can ship invoice payments.'));
			}
			updatePayment('SHIPORDER', callback);
		};
		payment.creditOrder = function (callback) {
			if (!options.invoiceFunding) {
				return callback(new Error('Can credit invoice payments.'));
			}
			updatePayment('CREDITORDER', callback);
		};
		payment.refund = function (callback) {
			if (options.invoiceFunding) {
				return callback(new Error('Can not refund invoice payments.'));
			}
			updatePayment('REFUND', callback);
		};
	};

	/*
	payson.validateIpn = function (content, callback) {
		ajax(content: content, function(err, data) {
			if (err) {
				return callback(err);
			}
			if (data !== 'VERIFIED') {
				return callback(new Error('Ipn content is invalid.'));
			}
			callback(null, data);
		});
	}
	*/
}

var payson = module.exports = Payson;
