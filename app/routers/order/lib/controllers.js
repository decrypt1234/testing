const fs = require("fs");
const ipfsAPI = require("ipfs-api");
const ipfs = ipfsAPI("ipfs.infura.io", "5001", {
  protocol: "https",
  auth: "21w11zfV67PHKlkAEYAZWoj2tsg:f2b73c626c9f1df9f698828420fa8439",
});
const { Order, NFT, Bid } = require("../../../models");
const pinataSDK = require("@pinata/sdk");
const multer = require("multer");
const pinata = pinataSDK(
  process.env.PINATAAPIKEY,
  process.env.PINATASECRETAPIKEY
);
const mongoose = require("mongoose");
const validators = require("./validators");
var jwt = require("jsonwebtoken");
const controllers = {};

controllers.createOrder = async (req, res) => {
  try {
    console.log(req);

    let orderDate = new Date().setFullYear(new Date().getFullYear() + 10);
    let validity = Math.floor(orderDate / 1000);

    const order = new Order({
      oNftId: req.body.nftId,
      oSellerWalletAddress: req.body.seller,
      oTokenId: req.body.tokenId,
      oTokenAddress: req.body.collection,
      oQuantity: req.body.quantity,
      oType: req.body.saleType,
      oPaymentToken: req.body.tokenAddress,
      oPrice: req.body.price,
      oSalt: req.body.salt,
      oSignature: req.body.signature,
      oValidUpto: req.body.validUpto,
      oBundleTokens: [],
      oBundleTokensQuantities: [],
      oStatus: 1,
      oSeller: req.userId,
      oStatus: req.body.status,
      auction_end_date: req.body.auctionEndDate,
    });

    order
      .save()
      .then((result) => {
        return res.reply(messages.created("Order"), result);
      })
      .catch((error) => {
        return res.reply(messages.already_exists("Failed:" + error));
      });
  } catch (error) {
    console.log("Error " + JSON.stringify(error));
    return res.reply(messages.server_error());
  }
};

controllers.deleteOrder = async (req, res) => {
  try {
    if (!req.userId) return res.reply(messages.unauthorized());
    await Order.find({ _id: req.body.orderId }).remove().exec();
    await Bid.find({ oOrderId: req.body.orderId, oBidStatus: "Bid" })
      .remove()
      .exec();

    return res.reply(messages.deleted("order"));
  } catch (err) {
    return res.reply(messages.error(), err.message);
  }
};

controllers.updateOrder = async (req, res) => {
  try {
    console.log("req---->", req.body);
    let lazyMintingStatus = Number(req.body.LazyMintingStatus);
    if (lazyMintingStatus === 0) {
      lazyMintingStatus = 0;
    } else if (lazyMintingStatus === 1 || lazyMintingStatus === 2) {
      lazyMintingStatus = 2;
    }
    if (!req.userId) return res.reply(messages.unauthorized());
    if (!req.body.oNftId)
      return res.reply(messages.bad_request(), "oNftId is required.");
    else
      await Order.updateOne(
        { _id: req.body.orderId },
        {
          $set: {
            oStatus: req.body.oStatus,
            quantity_sold: req.body.qty_sold,
          },
        },
        {
          upsert: true,
        },
        (err) => {
          if (err) throw error;
        }
      );

    //deduct previous owner
    let _NFT = await NFT.findOne({
      _id: mongoose.Types.ObjectId(req.body.oNftId),
      "nOwnedBy.address": req.body.oSeller,
    }).select("nOwnedBy -_id");

    console.log("_NFT-------->", _NFT);
    let currentQty = _NFT.nOwnedBy.find(
      (o) => o.address === req.body.oSeller.toLowerCase()
    ).quantity;
    let boughtQty = parseInt(req.body.oQtyBought);
    let leftQty = currentQty - boughtQty;
    if (leftQty < 1) {
      await NFT.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(req.body.oNftId) },
        {
          $pull: {
            nOwnedBy: { address: req.body.oSeller },
          },
        }
      ).catch((e) => {
        console.log("Error1", e.message);
      });
    } else {
      await NFT.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.oNftId),
          "nOwnedBy.address": req.body.oSeller,
        },
        {
          $set: {
            "nOwnedBy.$.quantity": parseInt(leftQty),
          },
        }
      ).catch((e) => {
        console.log("Error2", e.message);
      });
    }

    //Credit the buyer
    console.log("Crediting Buyer");

    let subDocId = await NFT.exists({
      _id: mongoose.Types.ObjectId(req.body.oNftId),
      "nOwnedBy.address": req.body.oBuyer,
    });
    if (subDocId) {
      console.log("Subdocument Id", subDocId);

      let _NFTB = await NFT.findOne({
        _id: mongoose.Types.ObjectId(req.body.oNftId),
        "nOwnedBy.address": req.body.oBuyer,
      }).select("nOwnedBy -_id");
      console.log("_NFTB-------->", _NFTB);
      console.log(
        "Quantity found for buyers",
        _NFTB.nOwnedBy.find((o) => o.address === req.body.oBuyer.toLowerCase())
          .quantity
      );
      currentQty = _NFTB.nOwnedBy.find(
        (o) => o.address === req.body.oBuyer.toLowerCase()
      ).quantity
        ? parseInt(
            _NFTB.nOwnedBy.find(
              (o) => o.address === req.body.oBuyer.toLowerCase()
            ).quantity
          )
        : 0;
      boughtQty = req.body.oQtyBought;
      let ownedQty = currentQty + boughtQty;

      await NFT.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.oNftId),
          "nOwnedBy.address": req.body.oBuyer,
        },
        {
          $set: {
            "nOwnedBy.$.quantity": parseInt(ownedQty),
          },
        },
        { upsert: true, runValidators: true }
      ).catch((e) => {
        console.log("Error1", e.message);
      });
    } else {
      console.log("Subdocument Id not found");
      let dataToadd = {
        address: req.body.oBuyer,
        quantity: parseInt(req.body.oQtyBought),
      };
      await NFT.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(req.body.oNftId) },
        { $addToSet: { nOwnedBy: dataToadd } },

        { upsert: true }
      );
      console.log("wasn't there but added");
    }
    await NFT.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(req.body.oNftId) },
      {
        $set: {
          nLazyMintingStatus: Number(lazyMintingStatus),
        },
      }
    ).catch((e) => {
      console.log("Error1", e.message);
    });
    return res.reply(messages.updated("order"));
  } catch (error) {
    return res.reply(messages.error(), error.message);
  }
};

controllers.getOrder = (req, res) => {
  try {
    Order.findOne({ _id: req.body.orderId }, (err, order) => {
      if (err) return res.reply(messages.server_error());
      if (!order) return res.reply(messages.not_found("Order"));
      return res.reply(messages.no_prefix("Order Details"), order);
    });
  } catch (error) {
    return res.reply(messages.server_error());
  }
};

controllers.getOrdersByNftId = async (req, res) => {
  try {
    //sample request
    //   {
    //     "nftId": "622191c2eea58614558fd2e7",
    //     "sortKey": "oTokenId",
    //     "sortType": -1,
    //     "page": 2,
    //     "limit": 1
    // }

    //sortKey is the column
    const sortKey = req.body.sortKey ? req.body.sortKey : oPrice;

    //sortType will let you choose from ASC 1 or DESC -1
    const sortType = req.body.sortType ? req.body.sortType : -1;

    var sortObject = {};
    var stype = sortKey;
    var sdir = sortType;
    sortObject[stype] = sdir;

    const page = parseInt(req.body.page);
    const limit = parseInt(req.body.limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};

    if (
      endIndex <
      (await Order.count({ oNftId: req.body.nftId, oStatus: 1 }).exec())
    ) {
      results.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    let AllOrders = await Order.find({
      oNftId: req.body.nftId,
      oStatus: 1,
    })
      .sort(sortObject)
      .limit(limit)
      .skip(startIndex)
      .exec();

    results.results = AllOrders;
    return res.reply(messages.success("NFT Orders List"), results);
  } catch (error) {
    return res.reply(messages.server_error(), error.message);
  }
};

module.exports = controllers;
