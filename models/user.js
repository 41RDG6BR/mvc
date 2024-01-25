const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  cart: {
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
      }
    ]
  }
});

userSchema.methods.clearCart= function() {
  this.cart = {items: []}
  return this.save();
}

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save()
}

userSchema.methods.addToCart = async function (product) {
  const cartProductIndex = this.cart.items.findIndex(cp => cp.productId.toString() === product._id.toString());

  if (cartProductIndex >= 0) {
    // If product is already in the cart, increment quantity
    this.cart.items[cartProductIndex].quantity += 1;
  } else {
    // If product is not in the cart, add it with quantity 1
    this.cart.items.push({ productId: product._id, quantity: 1 });
  }

  try {
    // Save the user with the updated cart
    const savedUser = await this.save();
    console.log('User saved successfully:', savedUser);
    return savedUser;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error; // Rethrow the error to propagate it to the caller
  }
};


const User = mongoose.model('User', userSchema);

module.exports = User;