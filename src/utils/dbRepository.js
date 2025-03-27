import { getDb } from '../config/database.js';

/**
 * Generic database repository to reduce code duplication
 */
export class DbRepository {
  /**
   * Create a new repository instance
   * @param {string} collectionName - MongoDB collection name
   */
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * Get the database collection
   * @returns {Collection} MongoDB collection
   */
  getCollection() {
    return getDb().collection(this.collectionName);
  }

  /**
   * Find documents matching a filter
   * @param {Object} filter - MongoDB filter
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Found documents
   */
  async find(filter = {}, options = {}) {
    try {
      const collection = this.getCollection();
      let query = collection.find(filter);
      
      if (options.sort) query = query.sort(options.sort);
      if (options.limit) query = query.limit(options.limit);
      if (options.skip) query = query.skip(options.skip);
      
      return await query.toArray();
    } catch (error) {
      console.error(`Error finding documents in ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Find a single document
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<Object>} Found document or null
   */
  async findOne(filter = {}) {
    try {
      return await this.getCollection().findOne(filter);
    } catch (error) {
      console.error(`Error finding document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Insert a document
   * @param {Object} document - Document to insert
   * @returns {Promise<Object>} Insert result
   */
  async insertOne(document) {
    try {
      return await this.getCollection().insertOne(document);
    } catch (error) {
      console.error(`Error inserting document into ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   * @param {Object} filter - MongoDB filter
   * @param {Object} update - Update operations
   * @returns {Promise<Object>} Update result
   */
  async updateOne(filter, update) {
    try {
      return await this.getCollection().updateOne(filter, update);
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(filter) {
    try {
      return await this.getCollection().deleteOne(filter);
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      throw error;
    }
  }
}