const amqp = require("amqplib/callback_api");

async function replyto() {
  amqp.connect(process.env.AMQP_URL, function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      const queue = "rpc_queue";

      channel.assertQueue(queue, {
        durable: false,
      });
      channel.prefetch(1);
      console.log(" [x] Awaiting RPC requests");
      channel.consume(queue, async function reply(msg) {
        const idCheck = await postExistCheck(parseInt(msg.content.toString()));
        console.log(idCheck);

        channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(idCheck)), {
          correlationId: msg.properties.correlationId,
        });

        channel.ack(msg);
      });
    });
  });
}

const db = require("../models/index.model");
const Post = db.post;

async function postExistCheck(id) {
  const postById = await Post.findByPk(id)
  if(postById === null){
    console.log('Not found!');
    return false
  }
  else{
    return true
  }
}

module.exports = { replyto };
