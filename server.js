
/*********************************************************************************
WEB322 Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Sumit kumar
Student ID: 143678225
Date: 05-07-2024
Vercel Web App URL: app-web2.vercel.app
GitHub Repository URL: https://github.com/Sumit07861/appWeb2
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: '',
  api_key: '',
  api_secret: '',
  secure: true
});


const upload = multer();
const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      console.error('Error fetching published items:', err);
      res.status(500).json({ message: err });
    });
});
//Updating items route
app.get('/items', function(req, res) {
  const { category, minDate } = req.query;

  // defining different promises
  let promise;
  if (category) {
    promise = storeService.getItemsByCategory(category);
  } else if (minDate) {
    promise = storeService.getItemsByMinDate(minDate);
  } else {
    promise = storeService.getAllItems();
  }

  // Handling common logic
  promise
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.error(err); 
      res.status(500).json({ message: 'Internal Server Error' });
    });
});

//id route
app.get('/item/:id', (req, res) => {
  storeService.getItemById(req.params.id)
    .then(item => {
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
      } else {
        res.json(item);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    });
});

app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      console.error('Error fetching categories:', err);
      res.status(500).json({ message: err });
    });
});

//AddItem
app.get('/items/add', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/addItem.html'));
});

//Item Route
app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    }).catch(error => {
      console.error(error);
      res.status(500).send('Image upload failed');
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    //Adding new item before redirecting to items
    storeService.addItem(req.body)
      .then(() => {
        res.redirect('/items');
      })
      .catch(err => {
        console.error(`Error adding item: ${err}`);
        res.status(500).send('Internal Server Error');
      });

  }
});

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

storeService.initialize()
  .then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Express http server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize store service:', err);
  });