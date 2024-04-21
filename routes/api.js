const express = require('express');
const router = express.Router();
const db = require('./database')
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
  const data = {
    $orderCode: req.body.data.orderCode,
    $paymentLinkId: req.body.data.paymentLinkId,
    $transactionDateTime: req.body.data.transactionDateTime
  }
  const insertQuery = `
    INSERT INTO payment (id, paymentLinkId, time)
    VALUES ($orderCode, $paymentLinkId, $transactionDateTime)
  `;

  db.run(insertQuery, data, function(err) {
    if (err) {
      res.send({success: true})
      console.error(err)
    } else {
      res.send({success: true})
    }
  });
})

router.get('/download', async function(req, res, next) {
  let ok = false
  while (!ok) {
    db.get(`SELECT * FROM payment WHERE paymentLinkId = ?`, req.query.id, async (err, row) => {
      if (err) {
        res.redirect(303, '/cancel?type=server')
        ok = true
      } else if (!row){
        await new Promise(r => setTimeout(r, 3000));
      } else {
        res.download('Bi mat cua may man.pdf')
        ok = true
      }
    })
    await new Promise(r => setTimeout(r, 3000));
  }
})

module.exports = router;
