
require('dotenv').config();
const db = require('./config/db').pool;
const OrderModel = require('./models/orderModel');

async function testGetOrderHistory() {
    try {
        console.log("Testing getBuyerOrders for user 13...");
        const orders = await OrderModel.getBuyerOrders(13);
        console.log("Success! Orders found: " + orders.length);
        console.log(JSON.stringify(orders, null, 2));
    } catch (error) {
        console.error("FAILED to get orders:");
        console.error(error);
    } finally {
        process.exit(0);
    }
}

testGetOrderHistory();
