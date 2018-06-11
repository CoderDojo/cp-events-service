'use strict';

function isOwnOrder (args, cb) {
  const seneca = this;
  const plugin = args.role;
  const userId = args.user.id;
  const orderId = args.params.orderId;
  const Order = seneca.make$('cd/orders');
  Order.load$({ id: orderId, userId }, (err, order) => {
    let isAllowed = false;
    if (err) {
      seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnOrder', err, {userId: userId, applicationId: applicationId}));
      return cb(null, { 'allowed': false });
    }
    if (order) {
      isAllowed = true;
    }
    return cb(null, { 'allowed': isAllowed });
  }); 
}

module.exports = isOwnOrder;
