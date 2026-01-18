
require('dotenv').config();
const fs = require('fs');
const db = require('./config/db').pool;
const OrderModel = require('./models/orderModel');

async function testGetOrderHistory() {
    try {
        console.log("Testing getBuyerOrders for user 13...");
        fs.writeFileSync('reproduce_log.txt', "Starting test...\n");

        const orders = await OrderModel.getBuyerOrders(13);

        fs.appendFileSync('reproduce_log.txt', "Success! Orders found: " + orders.length + "\n");
        fs.appendFileSync('reproduce_log.txt', JSON.stringify(orders, null, 2));
    } catch (error) {
        fs.appendFileSync('reproduce_log.txt', "\nFAILED to get orders:\n");
        fs.appendFileSync('reproduce_log.txt', error.stack || error.toString());
    } finally {
        process.exit(0);
    }
}

testGetOrderHistory();
