
/*********************************************************************************
WEB322 Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: 
Student ID: 
Date: 15/6/2024
Vercel Web App URL: 
GitHub Repository URL: 
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service');

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

app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      console.error('Error fetching all items:', err);
      res.status(500).json({ message: err });
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