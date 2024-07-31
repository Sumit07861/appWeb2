const Sequelize = require("sequelize");
const { Op } = require("sequelize");

const sequelize = new Sequelize("neondb", "neondb_owner", "0JY3oHmObAVt", {
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

const Item = sequelize.define("Item", {
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
    return sequelize.sync()
      .then(() => "sync completed")
      .catch((err) => Promise.reject("unable to sync the database"));
  },

  getAllItems: () => {
    return Item.findAll()
      .then((data) => data.length ? data : Promise.reject("No items found"))
      .catch((err) => Promise.reject("no results returned"));
  },

  getPublishedItems: () => {
    return Item.findAll({
      where: { published: true }
    })
    .then((data) => data)
    .catch((err) => Promise.reject(err));
  },

  getCategories: () => {
    return Category.findAll()
      .then((data) => data.length ? data : Promise.reject("no results returned"))
      .catch((err) => Promise.reject("no results returned"));
  },

  addItem: (itemData) => {
    itemData.published = !!itemData.published;
    itemData.itemDate = new Date();
    itemData.categoryID = parseInt(itemData.categoryID, 10);

    return Item.create(itemData)
      .then(() => "Item added successfully")
      .catch((err) => Promise.reject("Item creation failed"));
  },

  getItemsByCategory: (category) => {
    return Item.findAll({
      where: { categoryID: category }
    })
    .then((data) => data)
    .catch((err) => Promise.reject("no results returned"));
  },

  getCategoryById: (id) => {
    return Category.findByPk(id)
      .then((category) => category ? category : null)
      .catch((err) => Promise.reject(err));
  },

  getItemsByMinDate: (minDateStr) => {
    return Item.findAll({
      where: { itemDate: { [Op.gte]: new Date(minDateStr) } }
    })
    .then((data) => data.length ? data : Promise.reject("no results returned"))
    .catch((err) => Promise.reject("no results returned"));
  },

  getItemById: (id) => {
    return Item.findOne({
      where: { id: id }
    })
    .then((item) => item ? item : Promise.reject("Item not found"))
    .catch((err) => Promise.reject(err));
  },

  getPublishedItemsByCategory: (category) => {
    return Item.findAll({
      where: { categoryID: category, published: true }
    })
    .then((data) => data)
    .catch((err) => Promise.reject("no results returned"));
  },

  addCategory: (categoryData) => {
    for (const key in categoryData) {
      if (categoryData[key] === "") {
        categoryData[key] = null;
      }
    }
  
    return Category.create(categoryData)
      .then((data) => data)
      .catch((err) => Promise.reject("creation failed"));
  },
  
  deleteCategoryById: (id) => {
    return Category.destroy({
      where: { categoryID: id }
    })
    .then((rowsDeleted) => rowsDeleted === 0 ? Promise.reject("no results returned") : "deletion successful")
    .catch((err) => Promise.reject("deletion failed"));
  },
  
  deleteItemById: (id) => {
    return Item.destroy({
      where: { id: id }
    })
    .then((result) => result ? "deletion successful" : Promise.reject("no results found"))
    .catch((err) => Promise.reject("remove failed"));
  }
};
