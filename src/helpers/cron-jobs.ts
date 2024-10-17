import schedule from 'node-schedule';
import {
  OrderDetailModel,
  OrderModel,
  UserModel,
  UserWalletModel,
  UserTransactionModel,
  ProductVariantModel,
} from '../model/models';

// Commision sheduler function
const commisionCutting = async () => {
  try {
    let order = await OrderModel().rawSql(
      `SELECT *
            FROM orders
            WHERE "commissionDistributed" = false AND "isReturn" = false AND "isDelivered" = true AND "createdAt" >= NOW() - INTERVAL '7 days'`,
      [],
    );
    // AND "createdAt" >= NOW() - INTERVAL '7 days'
    //console.log(order.rows);

    if (order.rows.length < 1) {
      console.log({ message: 'No order was delivered within past 7 days.' });
    } else {
      let orderDetails = order.rows;
      //console.log(orderDetails);

      for (var i = 0; i < orderDetails.length; i++) {
        let orderdetail = await OrderDetailModel()
          .select('totalAmt,originalPrice, quantity,productId')
          .where({ orderId: orderDetails[i].id })
          .find();
        let totalCommission = 0;
        for (var j = 0; j < orderdetail.length; j++) {
          let product = await ProductVariantModel()
            .select('commissionPercentage')
            .where({ id: orderdetail[j].productId })
            .findOne();
          //console.log(product);
          let finalCommissionprice = orderdetail[j].originalPrice * orderdetail[j].quantity;
          let productCommission = Math.round(
            (finalCommissionprice * product.commissionPercentage) / 100,
          );
          totalCommission = totalCommission + productCommission;
        }

        let customer = await UserModel()
          .select('referredBy')
          .where({ id: orderDetails[i].customerId })
          .findOne();
        // console.log(customer);

        if (customer.referredBy) {
          let referrer = await UserModel()
            .select('id, walletValue')
            .where({ referralCode: customer.referredBy })
            .findOne();
          let customerAccount = await UserWalletModel()
            .select('id, walletAmount')
            .where({ userId: referrer.id })
            .findOne();

          //console.log(referrer);
          //console.log(customerAccount);

          let finalWalletAmount = customerAccount.walletAmount + totalCommission;
          let finalRefWalletAmount = referrer.walletValue + totalCommission;
          let transaction = await UserTransactionModel()
            .where({
              orderId: orderDetails[i].id,
              transactionType: true,
            })
            .findOne();

          if (!transaction) {
            let newTransaction = await UserTransactionModel().createOne({
              userId: referrer.id,
              orderId: orderDetails[i].id,
              amount: totalCommission,
              transactionType: '1',
              remarks: 'Commission Received',
            });
            if (newTransaction) {
              let updatecustomerwallet1 = await UserModel()
                .where({ referralCode: customer.referredBy })
                .select('id')
                .updateOne({
                  walletValue: finalRefWalletAmount,
                  updatedAt: new Date(),
                });

              let updatecustomerwallet2 = await UserWalletModel()
                .where({ userId: referrer.id })
                .select('id')
                .updateOne({
                  walletAmount: finalWalletAmount,
                  updatedAt: new Date(),
                });
            }
          }
        } else {
          console.log('No Referral Found');
        }

        let updateOrderTable = await OrderModel()
          .where({ id: orderDetails[i].id })
          .select('id')
          .updateOne({
            commissionDistributed: true,
            updatedAt: new Date(),
          });
      }
    }
  } catch (error) {
    console.error('Error Updating Commission:', error);
  }
};

// Schedule the job
// Automatic Calculate Incentives after 24 hours of Delivery
let rule = { hour: 23, minute: 50, tz: 'Asia/Kolkata' };
const midnightCron = schedule.scheduleJob(rule, () => {
  console.log(`Calculate Incentive for Customers  ${new Date()}`);
  commisionCutting();
});

export { midnightCron };
