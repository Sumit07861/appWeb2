
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
  }
};