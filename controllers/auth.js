const crypto = require('crypto');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn,
    csrfToken: req.csrfToken()
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  })
}

exports.postLogin = (req, res, next) => {
  const email= req.body.email
  const password = req.body.password

  User.findOne({email: email}).then(user => {
    if(!user) {
      return res.redirect('/')
    }
    bcrypt
      .compare(password, user.password)
      .then(doMatch => {
        if(doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
        
            return req.session.save(err => {
              console.log(err);
              return res.redirect('/');
          })
        }
      res.redirect('/login')
    }).catch(err => {
      console.log(err);
      res.redirect('/login');
    })

  })
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.password;

  User.findOne({email: email})
  .then(userDoc => {
    if(userDoc) {
      return res.redirect('/signup')
    }
    return bcrypt
      .hash(password, 12)  
      .then(hashedPassword => {
        const user = new User({
        email: req.body.email,
        password: hashedPassword,
        cart: {items: []}
      });
    return user.save();
  })
  .then(result => {
    res.redirect('/login');
  })
  })
.catch(err => {
    console.log(err);
  })
}
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  })
}

exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: 'message'
  })
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err) {
      console.log(err);
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email}).then(user => {
      if(!user) {
        res.flash('error', 'No account with that email found.');
        res.redirect('/reset')
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then(result => {
      res.redirect('/');
      transporter.sendMail({
        from: 'nogueirajsx@gmail.com',
        to: req.body.email,
        subject: 'You requested a password reset',
        html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a>to set a new password.</p>
        `,
      });
    })
    .catch(err => {
      console.error(err);
    })
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        userId: user._id.toString()
      })
    })
    .catch(err => {
      console.log(err);
    })
}