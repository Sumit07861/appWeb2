const Sequelize = require("sequelize");
const { gte } = require("sequelize").Op;

var sequelize = new Sequelize("neondb", "neondb_owner", "0JY3oHmObAVt", {
  host: "ep-ancient-glade-a5boi2uh.us-east-2.aws.neon.tech",
  dialect: "postgres",
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  query: { raw: true },
});

// TABLES

const Category = sequelize.define("Category", {
  categoryID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  categoryName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

const Item = sequelize.define("item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  itemDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
  categoryID: {
    type: Sequelize.INTEGER,
    references: {
      model: Category,
      key: "categoryID",
    },
  },
});

Item.belongsTo(Category, { foreignKey: "categoryID" });

// Exported functions
module.exports = {
  initialize: () => {
    try {
      sequelize.sync();
      return Promise.resolve("sync completed");
    } catch (err) {
      return Promise.reject("unable to sync the database");
    }
  },

  getAllItems: () => {
    return Item.findAll()
      .then((data) =>
        data.length ? Promise.resolve(data) : Promise.reject("No items found")
      )
      .catch((err) => Promise.reject("no results returned"));
  },

  getPublishedItems: () => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: {
          published: true,
        },
      })
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    });
  },

  getCategories: () => {
    return Category.findAll()
      .then((data) =>
        data.length
          ? Promise.resolve(data)
          : Promise.reject("no results returned")
      )
      .catch((err) => Promise.reject("no results returned"));
  },

  addItem: (itemData) => {
    itemData.published = !!itemData.published;
    itemData.itemDate = new Date();
    itemData.categoryID = parseInt(itemData.categoryID, 10);

    return new Promise((resolve, reject) => {
      Item.create(itemData)
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  },

  getItemsByCategory: (category) => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: {
          categoryID: category,
        },
      })
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    });
  },

  getCategoryById: (id) => {
    return new Promise((resolve, reject) => {
      Category.findByPk(id)
        .then((category) => {
          if (category) {
            resolve(category);
          } else {
            resolve(null);
          }
        })
        .catch((err) => reject(err));
    });
  },

  getItemsByMinDate: (minDateStr) => {
    return Item.findAll({
      where: {
        itemDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) =>
        data.length
          ? Promise.resolve(data)
          : Promise.reject("no results returned")
      )
      .catch((err) => Promise.reject("no results returned"));
  },

  getItemById: (id) => {
    return new Promise((resolve, reject) => {
      Item.findOne({
        where: { id: id },
      })
        .then((item) => {
          if (item) {
            resolve(item);
          } else {
            reject("Item not found");
          }
        })
        .catch((err) => reject(err));
    });
  },

  getPublishedItemsByCategory: (category) => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: {
          categoryID: category,
          published: true,
        },
      })
        .then((data) => resolve(data))
        .catch((err) => reject("no results returned"));
    });
  },

  addCategory: (categoryData) => {
    for (const key in categoryData) {
      if (categoryData[key] === "") {
        categoryData[key] = null;
      }
    }
  
    return Category.create(categoryData)
      .then(data => Promise.resolve(data))
      .catch(err => Promise.reject("creation failed"));
  },
  
  deleteCategoryById: (id) => {
    return Category.destroy({
      where: { categoryID: id }
    })
      .then(rowsDeleted => {
        if (rowsDeleted === 0) {
          return Promise.reject("no results returned");
        } else {
          return Promise.resolve("deletion successful");
        }
      })
      .catch(err => Promise.reject("deletion failed"));
  },
  
  deleteItemById: (id) => {
    return Item.destroy({ where: { id } })
      .then((result) => {
        if (result) {
          return Promise.resolve("deletion successful");
        } else {
          return Promise.reject("no results found");
        }
      })
      .catch((err) => Promise.reject(`remove failed`));
  }
};
