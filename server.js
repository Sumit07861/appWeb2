
/*********************************************************************************
WEB322 Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Sumit Kumar
Student ID: 143678225
Date: 31-07-2024
Vercel Web App URL: app-web2.vercel.app
GitHub Repository URL: https://github.com/Sumit07861/appWeb2
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const pg = require( 'pg' );

cloudinary.config({
  cloud_name: 'wahi-digital-marketing',
  api_key: '682177914154915',
  api_secret: 'BuHt-ZEGSw_j37oy1nLf0QohPQc',
  secure: true
});

const upload = multer();
const app = express();

app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url === app.locals.activeRoute
            ? ' class="nav-link active"'
            : 'class="nav-link"') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          '</a></li>'
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error('Handlebars Helper equal needs 2 parameters');
        if (lvalue !== rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
  })
);

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clientSessions({
  cookieName: 'session',
  secret: 'mynameissumit',
  duration: 24 * 60 * 60 * 1000, 
  activeDuration: 30 * 60 * 1000 
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (req.session.user) {
      next();
  } else {
      res.redirect('/login');
  }
}

app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    '/' +
    (isNaN(route.split('/')[1])
      ? route.replace(/\/(?!.*)/, '')
      : route.replace(/\/(.*)/, ''));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get('/', (req, res) => {
  res.redirect('shop');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];
    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
    let post = items[0];
    viewData.items = items;
    viewData.item = post;
  } catch (err) {
    viewData.message = "No results";
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results";
  }
  res.render("shop", { data: viewData });
});

app.get('/shop/:id', async (req, res) => {
  let viewData = {};

  try {
    const item = await storeService.getItemById(req.params.id);
    if (!item || !item.published) {
      viewData.message = `No results for item with ID: ${req.params.id}`;
    } else {
      viewData.item = item;

      const category = await storeService.getCategoryById(item.categoryID);
      viewData.item.categoryName = category ? category.categoryName : 'Unknown';
    }
  } catch (err) {
    viewData.message = "Error fetching item details";
  }

  try {
    const items = req.query.category
      ? await storeService.getPublishedItemsByCategory(req.query.category)
      : await storeService.getPublishedItems();
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
    viewData.items = items;
  } catch (err) {
    viewData.message = "not found the item you are looking for";
  }

  try {
    const categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "could not find the category you are looking for";
  }

  res.render("shop", { data: viewData });
});

app.get("/items", ensureLogin, async (req, res) => {
  try {
    let items;
    if (req.query.category) {
      items = await storeService.getItemsByCategory(req.query.category);
    } else if (req.query.minDate) {
      items = await storeService.getItemsByMinDate(req.query.minDate);
    } else {
      items = await storeService.getAllItems();
    }
    const categories = await storeService.getCategories();
    const categoryMap = categories.reduce((map, category) => {
      map[category.categoryID] = category.categoryName;
      return map;
    }, {});
    items = items.map(item => ({
      ...item,
      categoryName: categoryMap[item.categoryID] || 'Unknown'
    }));

    res.render("items", { items });
  } catch (err) {
    console.error('Error fetching items:', err);
    res.render("items", { message: "Item not found" });
  }
});

app.get('/item/:id', ensureLogin, (req, res) => {
  storeService.getItemById(req.params.id)
    .then(item => {
      if (!item) {
        res.status(404).json({ message: 'Did not find any item' });
      } else {
        res.json(item);
      }
    })
    .catch(err => {
      console.error('Error fetching item by ID:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    });
});

app.get('/categories', ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      if (data.length > 0) {
        res.render("categories", { categories: data });
      } else {
        res.render("categories", { message: "No results" });
      }
    })
    .catch((err) => {
      console.error('Error fetching categories:', err);
      res.status(500).render("categories", { message: "No results" });
    });
});

app.get('/items/add', ensureLogin, async (req, res) => {
  try {
    const categories = await storeService.getCategories();
    res.render('addItem', { categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/items/add', ensureLogin, upload.single('featureImage'), (req, res) => {
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
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    }).catch(error => {
      console.error('Error uploading image:', error);
      res.status(500).send('Image upload failed');
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

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

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch((err) => {
      console.error('Error adding category:', err);
      res.status(500).send('Internal Server Error');
    });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch((err) => {
      console.error('Error deleting category:', err);
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
  storeService
    .deleteItemById(req.params.id)
    .then(() => res.redirect("/items"))
    .catch((err) => {
      console.error('Error deleting item:', err);
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/items');
    })
    .catch(err => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render('register', { successMessage: "User created" });
    })
    .catch(err => {
      res.render('register', { errorMessage: err, userName: req.body.userName });
    });
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Modified -- 
storeService.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

module.exports = app;
