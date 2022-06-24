module.exports = (app) => {
  const posts = require("../controllers/post.controller.js");
  var router = require("express").Router();
  const { authJwt } = require("../middleware/middleware.index");

  // Create a new Post
  router.post("/", [
    authJwt.verifyToken
  ], posts.create);

  // Retrieve all posts
  router.get("/", [
    authJwt.verifyToken
  ], posts.findAll);

  // Retrieve a single Post with id
  router.get("/:id", [
    authJwt.verifyToken
  ], posts.findOne);

  // Update a Post with id
  router.put("/:id", [
    authJwt.verifyToken,
    authJwt.verifyUser
  ], posts.update);

  // Delete a Post with id
  router.delete("/:id", [
    authJwt.verifyToken,
    authJwt.verifyUser
  ], posts.delete);

  // Delete all posts
  router.delete("/", [
    authJwt.verifyToken,
    authJwt.isAdmin
  ], posts.deleteAll);

  app.use("/api/posts", router);
};
