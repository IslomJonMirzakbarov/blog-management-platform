const AWS = require("aws-sdk");
const keys = require("../config/keys");
const { v4: uuidv4 } = require("uuid");
const requireLogin = require("../middlewares/requireLogin");

const s3 = new AWS.S3({
  accessKeyId: keys.accessKeyId,
  secretAccessKey: keys.secretAccessKey,
});

module.exports = (app) => {
  app.get("/api/upload", requireLogin, (req, res) => {
    const key = `${req.user.id}/${uuidv4()}.jpeg`;

    s3.getSignedUrl(
      "putObject",
      {
        Bucket: "blogs-bucket-s3",
        Key: key,
        ContentType: "image/jpeg",
      },
      (err, url) => res.send({ key, url })
    );
  });
};
