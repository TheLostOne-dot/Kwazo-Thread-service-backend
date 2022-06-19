const express = require("express");
const cors = require("cors");
const amqp = require("amqplib/callback_api");
const posts = require("./src/controllers/post.controller");
const app = express();
const amqp_server = require("./src/service/amqp_rpc_server")

var corsOptions = {
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./src/models/index.model");
db.sequelize.sync();

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Post service running!" });
});

require("./src/routes/post.routes")(app);

const key = "*.post";

amqp.connect(process.env.AMQP_URL, function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    const exchange = "kwazo_exchange";

    channel.assertExchange(exchange, "topic", {
      durable: false,
    });

    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      function (error2, q) {
        if (error2) {
          throw error2;
        }
        console.log(" [*] Waiting for logs. To exit press CTRL+C");

        channel.bindQueue(q.queue, exchange, key);

        channel.consume(
          q.queue,
          function (msg) {
            console.log(
              " [x] %s:'%s'",
              msg.fields.routingKey,
              msg.content.toString()
            );
            posts.deleteByUsername(msg.content.toString())
          },
          {
            noAck: true,
          }
        );
      }
    );
  });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

(async () => {
  try {
    await amqp_server.replyto(); 
  } catch (error) {
    console.error(error);
  }
})()