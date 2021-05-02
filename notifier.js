const nodemailer = require('nodemailer');
const nodemailerTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.email,
    pass: process.env.password,
  },
});
exports.sendEmail = function (email, subject, slots, callback) {
  let options = {
    from: process.env.email,
    to: email,
    subject: subject,
    text: 'Details \n' + slots,
  };

  nodemailerTransporter.sendMail(options, (error, info) => {
    if (error) {
      return callback(error);
    }
    callback(error, info);
  });
};
