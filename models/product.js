const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
title: {
  type: String,
  requireq: true
},
price: {
  type: Number,
  required: true
},
description: {
  type: String,
  required: true,
},
imageUrl: {
  type: String,
  required: true
},
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}
});

module.exports = mongoose.model('Product', productSchema);