const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/cancel', function(req, res, next) {
  const type = req.query.type
  let title, message
  
  switch (type) {
    case "server":
      title = "Lỗi server"
      message = "Đã có lỗi xảy ra tại server, vui lòng thử lại sau"
      break
    case "payment":
      let link = process.env.DOMAIN_URL +  "success?id=" + req.query.id
      title = "Đơn hàng này không hợp lệ hoặc chưa được thanh toán"
      message = "Nếu bạn đã thanh toán, vui lòng quay lại <a href=\"" + link + "\">link</a> sau"
      break
    default:
      title = "Đơn hàng đã được huỷ thành công"
      message = ""
  }
  res.render('cancel', {title: title, message: message})
})

router.get('/success', function(req, res, next) {
  if (req.query.id) res.render('success', {id: req.query.id})
  else res.redirect(303, '/')
})

module.exports = router;
