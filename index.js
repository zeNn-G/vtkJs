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



// cors Policy setting
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8081');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
	})

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

var pathArr = [];

app.post("/upload", upload.single("vtk"), (req, res) => {
	pathArr = [];
  pathArr.push(req.file.path);

  res.send({
    paths: pathArr,
  });
});

app.get("/upload", (req, res) => {
	console.log('single file');

   
	
	console.log(pathArr[0]);

    // Download function provided by express
    res.download(__dirname + '/'+ pathArr[0], function(err) {
        if(err) {
            console.log(err);
        }
    })


});

app.get("/download", (req, res) => {
  res.sendFile(__dirname + "/Images/1659707901083.vtk");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
