# Node.js Payson lib

This Node.js lib is based on the Payson Integration Guide version 1.15 specification.

NOTE: THIS IS NOT YET PRODUCTION READY. STILL UNDER DEVELOPMENT.

## Get started

Install payson by adding it as a dependency to your package.json or:

	# npm install payson

You should create a new Payson instance using your Agent ID and API Password:

	var Payson = require('payson');
	var payson = new Payson('agentId', 'apiPassword');

If you have an application ID, you should add it as a third argument:

	var payson = new Payson('agentId', 'apiPassword');

### 1. Create a payment

To make a new payment:

	var payment = new payson.Payment({
		returnUrl: 'http://example.org/payson-return',
		cancelUrl: 'http://example.org/payson-cancel',
		memo: 'Buying cool things from example.org',
		senderEmail: 'test@example.org',
		senderFirstName: 'John',
		senderLastName: 'Doe'
	});

You have to add at least one recipient to your payment:

	new payment.Receiver({
		email: 'testagent-1@payson.se',
		amount: 195, // Should include VAT
		firstName: 'Sven',
		lastName: 'Svensson'
	});

You could also add items defining more exactly what you are about to sell:

	new payment.Item({
		description: 'Cool red gadget.',
		quantity: 5,
		unitPrice: 8, // Should exclude VAT
		taxPercentage: 25
	});

	new payment.Item({
		description: 'Cool box for gadgets.',
		quantity: 1,
		unitPrice: 116, // Should exclude VAT
		taxPercentage: 25
	});

### 2. Redirect user to Payson

When your payment is defined, you should redirect your user to Payson for the very payment.

	payment.getPaysonUrl(function (err, url) {
		if (err) {
			// Oh no :(
			return;
		}
		// Now, redirect your user to that url (or embed it as an iframe)...
	});

## All methods

### Payson(string agentId, string apiPassword, [string applicationId])

Constructor for creating a new Payson object.

### Payson.Payment([object options])

Constructor for creating a new payment.

The optional options argument is an object with the following keys (and default values):

	{
		returnUrl: '', // URL to which the customer's browser is redirected after the payment is completed. Please note that this includes both successful and unsuccessful payments.
		cancelUrl: '', // URL to which the customer is redirected if the payment is canceled by the user.
		memo: '', // Description of items the customer is purchasing.
		ipnNotificationUrl: '', // The URL for receiving an Instant Payment Notification about this payment.
		localeCode: 'EN', // Locale of pages displayed by Payson during payment. Can be 'EN', 'FI' or 'SV'.
		currencyCode: 'EUR', // The currency used for the payment. Can be 'EUR' or 'SEK'.
		creditCardFunding: true, // Credit card is an allowed funding selection for the payment.
		bankFunding: false, // Bank is an allowed funding selection for the payment.
		invoiceFunding: false, // Invoice is an allowed funding selection. If this is true, both creditCardFunding and bankFunding will be considered to be false.
		senderPaysFee: false, // The payer of Payson fees. If true, the sender will pay the Payson fee. If false, the receiver will pay the Payson fee.
		invoiceFee: 0, // An invoice fee that will be added as an order item.
		custom: '', // A free-form field for your own use.
		trackingId: '', // Your own invoice or tracking id.
		guaranteeOffered: undefined, // Whether Payson Guarantee is offered or not. Undefined means it is optional for the user. False means no. True means it is required for the payment.
		senderEmail: '', // Email address of the person sending money. This is the Payson account where the settled amount is transferred from.
		senderFirstName: '', // First name of the buyer as entered during checkout. Payson uses this value to pre fill the Payson membership signup portion of the Payson login page.
		senderLastName: '' // Last name of the buyer as entered during checkout. Payson uses this value to pre-fill the Payson membership signup portion of the Payson login page.
	}

### Payson.Payment.bankFunding([string value])

If called with an argument, this function will set the bankFunding value and return the payson object (for chaining).

If called without an argument, this function will return the current bankFunding value.

### Payson.Payment.cancelOrder()

Cancel an order before it is shipped and thereby canceling the entire payment.

Only possible if type is INVOICE and invoiceStatus is ORDERCREATED.

### Payson.Payment.cancelUrl([string value])

If called with an argument, this function will set the cancelUrl value and return the payson object (for chaining).

If called without an argument, this function will return the current cancelUrl value.

### Payson.Payment.creditCardFunding([string value])

If called with an argument, this function will set the creditCardFunding value and return the payson object (for chaining).

If called without an argument, this function will return the current creditCardFunding value.

### Payson.Payment.creditOrder()

Credit an order that has been shipped. A credit invoice will be issued for the entire invoice.

The full amount including Payson's fee will be drawn from the receiver account. If the receiver account has insufficient funds it is not possible to credit the order. If Payson has not yet settled money to the receiver, the fee will still be drawn from the account. 

Only possible if type is INVOICE and invoiceStatus is SHIPPED or DONE.

### Payson.Payment.currencyCode([string value])

If called with an argument, this function will set the currencyCode value and return the payson object (for chaining).

If called without an argument, this function will return the current currencyCode value.

### Payson.Payment.custom([string value])

If called with an argument, this function will set the custom value and return the payson object (for chaining).

If called without an argument, this function will return the current custom value.

### Payson.Payment.getDetails(function callback)

This function will call the Payson API PaymentDetails request. Note: This function will fail if you call it before you have called Payson.Payment.getPaysonUrl().

The callback will called with two arguments: callback(error, data)

The data argument to callback() should be an object with those properties:

	{
		purchaseId: '...', // Payson purchaseId for this payment.
		senderEmail: '...', // The sender's email address.
		status: '...', // The status. More info below.
		type: '...', // "TRANSFER", "GUARANTEE" or "INVOICE"
		guaranteeStatus: '', // The status of an ongoing Payson Guarantee payment.
		guaranteeDeadlineTimestamp: '...', // Timestamp that identifies when the next guarantee deadline is due, if one exists.
		invoiceStatus: '...', // The status of an ongoing Payson Invoice payment. More info below.
		custom: '...', // A free-form field. Should be the same as Payson.Payment.custom()
		trackingId: '...', // Your own invoice or tracking id submitted with the Pay request.
		receiverList.receiver{n}.email: '...', // Email address of the receiver.
		receiverList.receiver{n}.amount: '...', // The amount to transfer to this receiver.
		receiverList.receiver{n}.primary: '...', // Determines whether this is the primary receiver or not.
		currencyCode: '...', // A three-character currency code.
		receiverFee: '...', // The fee charged the receiver of the payment.
		shippingAddress.name: '...', // The name of the shipment's receiver. (Only for INVOICE payments.)
		shippingAddress.streetAddress: '...', // The name of the shipment's receiver. (Only for INVOICE payments.)
		shippingAddress.postalCode: '...', // The name of the shipment's receiver. (Only for INVOICE payments.)
		shippingAddress.city: '...', // The name of the shipment's receiver. (Only for INVOICE payments.)
		shippingAddress.country: '...' // The name of the shipment's receiver. (Only for INVOICE payments.)
	}

### Payson.Payment.getPaysonUrl(function callback)

This function will call the Payson API Initalize request. The callback will be called with two arguments: callback(error, url). The url argument is where you should forward the user to finalize the payment.

### Payson.Payment.guaranteeOffered([string value])

If called with an argument, this function will set the guaranteeOffered value and return the payson object (for chaining).

If called without an argument, this function will return the current guaranteeOffered value.

### Payson.Payment.invoiceFee([string value])

If called with an argument, this function will set the invoiceFee value and return the payson object (for chaining).

If called without an argument, this function will return the current invoiceFee value.

### Payson.Payment.invoiceFunding([string value])

If called with an argument, this function will set the invoiceFunding value and return the payson object (for chaining).

If called without an argument, this function will return the current invoiceFunding value.

### Payson.Payment.ipnNotificationUrl([string value])

If called with an argument, this function will set the ipnNotificationUrl value and return the payson object (for chaining).

If called without an argument, this function will return the current ipnNotificationUrl value.

### Payson.Payment.localeCode([string value])

If called with an argument, this function will set the localeCode value and return the payson object (for chaining).

If called without an argument, this function will return the current localeCode value.

### Payson.Payment.memo([string value])

If called with an argument, this function will set the memo value and return the payson object (for chaining).

If called without an argument, this function will return the current memo value.

### Payson.Payment.refund() 

Refunds a Payson Direct payment to the sender. If the sender deposited a part of the amount it will be refunded to the origin (credit card/bank) if the origin supports it. Remaining parts will be refunded to the sender's Payson account.

Only possible if type is DIRECT.

### Payson.Payment.returnUrl([string value])

If called with an argument, this function will set the returnUrl value and return the payson object (for chaining).

If called without an argument, this function will return the current returnUrl value.

### Payson.Payment.senderEmail([string value])

If called with an argument, this function will set the senderEmail value and return the payson object (for chaining).

If called without an argument, this function will return the current senderEmail value.

### Payson.Payment.senderFirstName([string value])

If called with an argument, this function will set the senderFirstName value and return the payson object (for chaining).

If called without an argument, this function will return the current senderFirstName value.

### Payson.Payment.senderLastName([string value])

If called with an argument, this function will set the senderLastName value and return the payson object (for chaining).

If called without an argument, this function will return the current senderLastName value.

### Payson.Payment.senderPaysFee([string value])

If called with an argument, this function will set the senderPaysFee value and return the payson object (for chaining).

If called without an argument, this function will return the current senderPaysFee value.

### Payson.Payment.shipOrder()

Ship an order and thereby convert it into an invoice. The sender will be notified by Payson that an invoice has been created.

Only possible if type is INVOICE and invoiceStatus is ORDERCREATED.

### Payson.Payment.trackingId([string value])

If called with an argument, this function will set the trackingId value and return the payson object (for chaining).

If called without an argument, this function will return the current trackingId value.

### Payson.Payment.Receiver([object options])

Constructor for creating a new payment receiver. Note: One payment can have multiple receivers. The first receiver created will be considered "primary receiver". If Payment.senderPaysFee is set to false (which is the default), then the primary receiver will pay the fee.

The optional options argument is an object with the following keys (and default values):

	{
		email: '', // Email address of the receiver.
		amount: 0, // The amount (including VAT) to transfer to this recipient.
		firstName: '', // Firstname of receiver.
		lastName: '' // Lastname of receiver.
	};

### Payson.Payment.Receiver.amount([string value])

If called with an argument, this function will set the amount value and return the payson object (for chaining).

If called without an argument, this function will return the current amount value.

### Payson.Payment.Receiver.email([string value])

If called with an argument, this function will set the email value and return the payson object (for chaining).

If called without an argument, this function will return the current email value.

### Payson.Payment.Receiver.firstName([string value])

If called with an argument, this function will set the firstName value and return the payson object (for chaining).

If called without an argument, this function will return the current firstName value.

### Payson.Payment.Receiver.lastName([string value])

If called with an argument, this function will set the lastName value and return the payson object (for chaining).

If called without an argument, this function will return the current lastName value.

### Payson.Payment.Item([object options])

Constructor for creating a new order item. Order items are required when doing invoice payments, and optional for credit card or bank payments.

The optional options argument is an object with the following keys (and default values):

	{
		description: '', // Description of this item.
		sku: '', // SKU of this item.
		quantity: 0, // Quantity of this item.
		unitPrice: 0, // The unit price of this item not including VAT.
		taxPercentage: 0 // Tax percentage for this item.
	}

### Payson.Payment.Receiver.description([string value])

If called with an argument, this function will set the description value and return the payson object (for chaining).

If called without an argument, this function will return the current description value.

### Payson.Payment.Receiver.quantity([string value])

If called with an argument, this function will set the quantity value and return the payson object (for chaining).

If called without an argument, this function will return the current quantity value.

### Payson.Payment.Receiver.sku([string value])

If called with an argument, this function will set the sku value and return the payson object (for chaining).

If called without an argument, this function will return the current sku value.

### Payson.Payment.Receiver.taxPercentage([string value])

If called with an argument, this function will set the taxPercentage value and return the payson object (for chaining).

If called without an argument, this function will return the current taxPercentage value.

### Payson.Payment.Receiver.unitPrice([string value])

If called with an argument, this function will set the unitPrice value and return the payson object (for chaining).

If called without an argument, this function will return the current unitPrice value.


