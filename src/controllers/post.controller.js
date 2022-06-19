const db = require("../models/index.model");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib/callback_api");
const Post = db.post;
const Op = db.Sequelize.Op;

// Create and Save a new Post
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title || !req.body.description) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  //Username from cookie
  if (!req.headers.cookie) {
    res.clearCookie("access_token");
    res.status(401).send({
      message: "Please login or create an account!",
    });
    return;
  }
  var token = req.headers.cookie;
  var test = jwt.verify(token.replace("access_token=", ""), process.env.JWT_SECRET);

  // Create a Post
  const post = {
    title: req.body.title,
    description: req.body.description,
    username: test.username,
  };

  // Save Post in the database
  Post.create(post)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the post.",
      });
    });
};

// Retrieve all Posts from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;
  Post.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving posts.",
      });
    });
};

// Find a single Post with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Post.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Post with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Post with id=" + id,
      });
    });
};

// Update a Post by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  Post.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Post was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Post with id=${id}. Maybe Post was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Post with id=" + id,
      });
    });
};

// Delete a Post with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Post.findOne({
    where: {
      id: id,
    },
  })
    .then((post) => {
      amqp.connect(process.env.AMQP_URL, function (error0, connection) {
        if (error0) {
          throw error0;
        }
        connection.createChannel(function (error1, channel) {
          if (error1) {
            throw error1;
          }
          const exchange = "kwazo_exchange";
          const key = "post-deleted.comment";

          channel.assertExchange(exchange, "topic", {
            durable: false,
          });
          channel.publish(exchange, key, Buffer.from(post.id.toString()));
          console.log(" [x] Sent %s:'%s'", key, post.id);
        });

        setTimeout(function () {
          connection.close();
          // process.exit(0);
        }, 500);
      });
    })
    .then(() => {
      Post.destroy({
        where: { id: id },
      })
        .then((num) => {
          if (num == 1) {
            res.send({
              message: "Post was deleted successfully!",
            });
          } else {
            res.send({
              message: `Cannot delete Post with id=${id}. Maybe Post was not found!`,
            });
          }
        })
        .catch((err) => {
          res.status(500).send({
            message: "Could not delete Post with id=" + id,
          });
        });
    });
};

// Delete all Posts from the database.
exports.deleteAll = (req, res) => {
  Post.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Posts were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while removing all posts.",
      });
    });
};

exports.deleteByUsername = (username) => {
  var condition = username
    ? { username: { [Op.like]: `%${username}%` } }
    : null;
  Post.findAll({ where: condition })
    .then((data) => {
      console.log(data);
      data.forEach((post) => {
        amqp.connect(process.env.AMQP_URL, function (error0, connection) {
          if (error0) {
            throw error0;
          }
          connection.createChannel(function (error1, channel) {
            if (error1) {
              throw error1;
            }
            const exchange = "kwazo_exchange";
            const key = "post-deleted.comment";

            channel.assertExchange(exchange, "topic", {
              durable: false,
            });
            channel.publish(exchange, key, Buffer.from(post.id.toString()));
            console.log(" [x] Sent %s:'%s'", key, post.id);
          });

          setTimeout(function () {
            connection.close();
            // process.exit(0);
          }, 500);
        });
      });
    })
    .then(() => {
      Post.destroy({
        where: condition,
        truncate: false,
      }).then((nums) => {
        console.log({ message: `${nums} Posts were deleted successfully!` });
      });
    })
    .catch((err) => {
      console.log({
        message: err.message || "Some error occurred while removing all posts.",
      });
    });
};
