const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const storage = new Storage();

exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err) {
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;
      next();
    });
};

exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem with image",
      });
    }

    // Destructure the fields
    const { name, description, price, category, stock, photo } = fields;

    // TODO restrictions
    let product = new Product(fields);
    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        error: "Please include all fields",
        product: product,
      });
    }

    // handle file here
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "File size too big",
        });
      }

      async function uploadFile() {
        const data = await storage
          .bucket("product-images-new-website")
          .upload(file.photo.path, {
            gzip: true,
            metadata: {
              cacheControl: "no-cache",
            },
            resumable: false,
          });
        return data;
      }
      uploadFile()
        .then((d) => {
          product.photo = `${d[0].metadata.name}`;
          // // save to db
          product.save((err, product) => {
            if (err) {
              return res.status(400).json({
                error: "Saving product in DB failed",
              });
            }
            res.json(product);
          });
        })
        .catch((err) => {
          return res.status(400).json({
            error: "Error occured while uploading photo",
            err,
          });
        });
    }

    // console.log(product);
  });
};

exports.getProduct = (req, res) => {
  return res.json(req.product);
};

// delete
exports.deleteProduct = (req, res) => {
  const product = req.product;
  async function deleteFile() {
    await storage.bucket(process.env.BUCKET_NAME).file(product.photo).delete();
  }
  deleteFile().catch((err) => {
    return res.status(400).json({
      error: "Failed to delete photo",
      err,
    });
  });
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete :",
        deletedProduct,
      });
    }
    res.json({
      message: "Deletion was a success",
      deletedProduct,
    });
  });
};

// update
exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem with image",
      });
    }

    // updation code
    const product = req.product;
    product = _.extend(product, fields);

    // handle file here
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "File size too big",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    // console.log(product);

    // save to db
    product.save((err, product) => {
      if (err) {
        return res.status(400).json({
          error: "Updation of product failed",
        });
      }
      res.json(product);
    });
  });
};

// read
exports.getAllProducts = (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  Product.find({})
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        res.status(400).json({
          error: "No product found",
        });
      }
      res.json(products);
    });
};

exports.getAllUniqueCategories = (req, res) => {
  Product.distinct("category", {}, (err, category) => {
    if (err) {
      res.status(400).json({
        error: "No category found ",
      });
    }
    res.json(category);
  });
};

exports.updateStock = (req, res, next) => {
  let myOperations = req.body.order.map((prod) => {
    return {
      updateOne: {
        filter: { _id: prod._id },
        update: { $inc: { stock: -prod.count, sold: +prod.count } },
      },
    };
  });

  Product.bulkWrite(myOperations, {}, (err, result) => {
    if (err) {
      res.status(400).json({
        error: "Bulk operation failed",
      });
    }
    next();
  });
};
