
const fs = require('fs');
const path = require('path');

// Global arrays
let items = [];
let categories = [];

// Exported functions
module.exports = {
  initialize: () => {
    return new Promise((resolve, reject) => {
      const itemsPath = path.join(__dirname, 'data', 'items.json');
      const categoriesPath = path.join(__dirname, 'data', 'categories.json');

      // Read items.json
      fs.readFile(itemsPath, 'utf8', (err, itemsData) => {
        if (err) {
          console.error(`Unable to read ${itemsPath}:`, err);
          reject('Unable to read items.json');
          return;
        }

        // Parse items data
        try {
          items = JSON.parse(itemsData);
        } catch (parseErr) {
          console.error(`Error parsing ${itemsPath}:`, parseErr);
          reject('Error parsing items.json');
          return;
        }

        // Read categories.json
        fs.readFile(categoriesPath, 'utf8', (err, categoriesData) => {
          if (err) {
            console.error(`Unable to read ${categoriesPath}:`, err);
            reject('Unable to read categories.json');
            return;
          }

          // Parse categories data
          try {
            categories = JSON.parse(categoriesData);
          } catch (parseErr) {
            console.error(`Error parsing ${categoriesPath}:`, parseErr);
            reject('Error parsing categories.json');
            return;
          }

          resolve(); // Resolve the promise
        });
      });
    });
  },

  getAllItems: () => {
    return new Promise((resolve, reject) => {
      if (items.length === 0) {
        reject('No items available');
        return;
      }
      resolve(items);
    });
  },

  getPublishedItems: () => {
    return new Promise((resolve, reject) => {
      const publishedItems = items.filter(item => item.published === true);
      if (publishedItems.length === 0) {
        reject('No published items available');
        return;
      }
      resolve(publishedItems);
    });
  },

  getCategories: () => {
    return new Promise((resolve, reject) => {
      if (categories.length === 0) {
        reject('No categories available');
        return;
      }
      resolve(categories);
    });
  },

  addItem: (itemData) => {
    return new Promise((resolve, reject) => {
      try {
       
        if (itemData.published === undefined) {
          itemData.published = false;
        } else {
          itemData.published = !!itemData.published; 
        }
        itemData.id = items.length + 1;

        items.push(itemData);

        resolve(itemData);
      } catch (err) {
        reject(`Error adding item: ${err}`);
      }
    });
  },


  getItemsByCategory: (category) => {
    return new Promise((resolve, reject) => {
      const filteredItems = items.filter(item => item.category == category);
      if (filteredItems.length === 0) {
        reject("No results returned");
      } else {
        resolve(filteredItems);
      }
    });
  },

  getItemsByMinDate: (minDateStr) => {
    return new Promise((resolve, reject) => {
      const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
      if (filteredItems.length === 0) {
        reject("No results returned");
      } else {
        resolve(filteredItems);
      }
    });
  },

  getItemById: (id) => {
    return new Promise((resolve, reject) => {
      const item = items.find(item => item.id == id);
      if (!item) {
        reject("No result returned");
      } else {
        resolve(item);
      }
    });
  }
  
};