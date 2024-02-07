const Products = require('../models/product');
const Product = require('../models/product');
const Order =  require('../models/order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  Products.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        isAuthenticated: req.isLoggedIn
      });
  })
  .catch(err => {
    console.log(err)
  })
}

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product, 
        pageTitle: product,
        path: '/products',
        isAuthenticated: req.isLoggedIn
      })
    })
    .catch(err => console.log(err))
}

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
      .skip((page -1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      console.log('CSRF Token:', req.csrfToken());
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
  })
  .catch(err => {
    console.log(err)
  })
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then(user => {
      const products = [user.cart.items];
          res.render('shop/cart', {
            path: '/cart',
            pageTitle :'Your Cart',
            products: products,
            isAuthenticated: req.isLoggedIn
          })
    })
    .catch(err => console.log(err));
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        throw new Error('Product not found');
      }
      console.log('product: ', product);
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result, "RESULT");
      res.redirect('/cart');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal Server Error');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart')
    })
    .catch(err => console.log(err));
}

exports.postOrder = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  // .execPopulate()
  .then(user => {
    const products = user.cart.items.map(i => {
      return {quantity: i.quantity, product: i.productId}
    });
    const order =  new Order({
      products: products,
      user: {
        email: req.user.email,
        userId: req.user
      }
    })
    return order.save()
  })
  .then(() => {
   return req.user.clearCart();
  })
  .then(() => {
    res.redirect('/orders')
  })
  .catch(err => console.log(err));
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  // .execPopulate()
  .then(user => {
    const products = user.cart.items.map(i => {
      return {quantity: i.quantity, product: i.productId}
    });
    const order =  new Order({
      products: products,
      user: {
        email: req.user.email,
        userId: req.user
      }
    })
    return order.save()
  })
  .then(() => {
   return req.user.clearCart();
  })
  .then(() => {
    res.redirect('/orders')
  })
  .catch(err => console.log(err));
}

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id })
  .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle :'Your Order',
        orders: orders,
        isAuthenticated: req.isLoggedIn
      });
    })
    .catch(err => console.log(err));
}

exports.getCheckout = (req, res, next) => {
  console.log('Iniciando processo de checkout...');

  let products;
  let total = 0;

  req.user
    .populate('cart.items.productId')
    .then(user => {
      console.log('Usuário encontrado:', user);
      products = user.cart.items;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      const lineItems = products.map(p => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: p.productId.title,
            description: p.productId.description,
          },
          unit_amount: p.productId.price * 100,
        },
        quantity: p.quantity,
      }));

      console.log('Criando sessão de checkout com Stripe...');
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then(session => {
      console.log('Sessão de checkout criada com sucesso:', session);
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch(err => {
      console.error('Erro durante o processo de checkout:', err);
      res.redirect('/');
    });
};
