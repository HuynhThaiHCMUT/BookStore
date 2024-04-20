var express = require('express');
var router = express.Router();

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
    default:
      title = "Đơn hàng đã được huỷ thành công"
      message = ""
  }
  res.render('cancel', {title: title, message: message})
})

router.get('/success', function(req, res, next) {
  res.render('success');
})

module.exports = router;
