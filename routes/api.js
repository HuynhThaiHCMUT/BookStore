const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config()

const PayOS = require('@payos/node')

const clientId = process.env.CLIENT_ID
const apiKey = process.env.API_KEY
const checksumKey = process.env.CHECKSUM_KEY
const domainUrl = process.env.DOMAIN_URL

if (!clientId || !apiKey || !checksumKey || !domainUrl) {
  console.log("Missing environment variable")
  process.exit(1)
}

const payos = new PayOS(clientId, apiKey, checksumKey)
const db = new sqlite3.Database('database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS payment (
    id INTEGER PRIMARY KEY,
    paymentLinkId TEXT NOT NULL UNIQUE,
    time TEXT NOT NULL
  )`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table "payment" created successfully.');
  }
})

process.on('exit', function() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Database connection closed.');
  });
});

router.post('/create-payment', (req, res) => {
  //Get the largest id from database to use as orderCode
  db.get(`SELECT * FROM payment ORDER BY id DESC LIMIT 1`, async (err, row) => {
    if (err) {
      console.error('Error accessing database:', err.message);
      res.redirect(303, '/cancel?type=database')
    } else {
      const id = row ? row.id : 0
      const order = {
        orderCode: id + 1,
        amount: 10000,
        description: "Thanh toan sach",
        cancelUrl: `${domainUrl}cancel`,
        returnUrl: `${domainUrl}success`,
      }
      let payment
      while (true) {
        //Probe available orderCode
        try {
          payment = await payos.createPaymentLink(order)
          break
        } catch {
          order.orderCode += 1
        }
      }
      res.redirect(303, payment.checkoutUrl)
    }
  });
  
})

router.post('/webhook', async (req, res) => {
  console.log(req.body)
  const insertQuery = `
    INSERT INTO payment (id, paymentLinkId, time)
    VALUES ($orderCode, $paymentLinkId, $transactionDateTime)
  `;

  db.run(insertQuery, req.body.data, function(err) {
    if (err) {
      res.send({success: true})
      console.error(err)
    } else {
      res.send({success: true})
    }
  });
})

module.exports = router;
