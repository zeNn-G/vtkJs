const express = require("express");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./Images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const app = express();

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const pathArr = [];

app.post("/upload", upload.single("vtk"), (req, res) => {
  pathArr.push(req.file.path);

  res.send({
    paths: pathArr,
  });
});

app.get("/upload", (req, res) => {
  res.send({
    path: pathArr[0],
  });
});

app.get("/download", (req, res) => {
  res.sendFile(__dirname + "/Images/1659707901083.vtk");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
