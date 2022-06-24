const jwt = require("jsonwebtoken");
const db = require("../models/index.model");
const Post = db.post;
require("dotenv").config();

verifyToken = (req, res, next) => {
  let token = req.headers.cookie;
  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }
  jwt.verify(
    token.replace("access_token=", ""),
    process.env.JWT_SECRET,
    (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Unauthorized!",
        });
      }
      req.userId = decoded.id;
      next();
    }
  );
};
isAdmin = (req, res, next) => {
  let token = req.headers.cookie;
  var test = jwt.verify(
    token.replace("access_token=", ""),
    process.env.JWT_SECRET
  );
  if (test.role === "admin") {
    next();
    return;
  }
  res.status(403).send({
    message: "Require Admin Role!",
  });
  return;
};
isModerator = (req, res, next) => {
  let token = req.headers.cookie;
  var test = jwt.verify(
    token.replace("access_token=", ""),
    process.env.JWT_SECRET
  );
  if (test.role === "moderator" || test.role === "admin") {
    next();
    return;
  }
  res.status(403).send({
    message: "Require Moderator Role!",
  });
};

verifyUser = (req,res,next) => {
  let token = req.headers.cookie;
  var test = jwt.verify(
    token.replace("access_token=", ""),
    process.env.JWT_SECRET
  );
  if(test.role === "user"){
    Post.findByPk(req.params.id).then((post) => {
      if(post.username == test.username){
        next();
        return
      }
      res.status(403).send({
        message: "You do not have permission to do this."
      })
    })
  }
  else if(test.role === 'admin' || test.role === 'moderator'){
    next();
    return;
  }
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  verifyUser: verifyUser
};
module.exports = authJwt;
