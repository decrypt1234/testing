const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  nftID: {
    type: mongoose.Schema.ObjectId,
    ref: "NFT",
  },
  collectionAddress: {
    type: String,
    require: true
  },
  sellerID: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  salesType: {
    type: Number,
    enum: [0, 1], // 0-Fixed Sale 1-Timed Auction
  },
  quantity: {
    address: {
      type: String,
      lowercase: true,
    },
    quantity: {
      type: Number,
    },
  },
  price: {
    type: Number,
  },
  tokenID: {
    type: String,
  },
  tokenAddress: {
    type: String,
  },
  deadline: {
    type: Date,
  },
  paymentToken: {
    type: String,
  },
  salt: {
    type: String,
  },
  signature: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  lastUpdatedOn: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Order", orderSchema);