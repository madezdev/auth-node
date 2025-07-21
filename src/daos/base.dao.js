import logger from '../config/logger.config.js'

/**
 * Base DAO (Data Access Object)
 * This abstract class provides the foundation for all data access operations
 * to be implemented by specific model DAOs.
 */
export class BaseDao {
  constructor (model) {
    this.model = model
  }

  async getAll (filter = {}, options = {}) {
    try {
      logger.debug(`Fetching all ${this.model.modelName} with filter: ${JSON.stringify(filter)}`)
      return this.model.find(filter, null, options)
    } catch (error) {
      logger.error(`Error fetching ${this.model.modelName}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  async getById (id) {
    try {
      logger.debug(`Fetching ${this.model.modelName} with id: ${id}`)
      return this.model.findById(id)
    } catch (error) {
      logger.error(`Error fetching ${this.model.modelName} by id ${id}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  async getOne (filter) {
    try {
      logger.debug(`Fetching one ${this.model.modelName} with filter: ${JSON.stringify(filter)}`)
      return this.model.findOne(filter)
    } catch (error) {
      logger.error(`Error fetching one ${this.model.modelName}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  async create (data) {
    try {
      logger.info(`Creating new ${this.model.modelName}`)
      const result = await this.model.create(data)
      logger.debug(`Created ${this.model.modelName} with id: ${result._id}`)
      return result
    } catch (error) {
      logger.error(`Error creating ${this.model.modelName}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  async update (id, data) {
    try {
      logger.info(`Updating ${this.model.modelName} with id: ${id}`)
      const result = await this.model.findByIdAndUpdate(id, data, { new: true })
      if (!result) {
        logger.warn(`${this.model.modelName} with id ${id} not found for update`)
      } else {
        logger.debug(`Updated ${this.model.modelName} with id: ${id}`)
      }
      return result
    } catch (error) {
      logger.error(`Error updating ${this.model.modelName} with id ${id}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  async delete (id) {
    try {
      logger.info(`Deleting ${this.model.modelName} with id: ${id}`)
      const result = await this.model.findByIdAndDelete(id)
      if (!result) {
        logger.warn(`${this.model.modelName} with id ${id} not found for deletion`)
      } else {
        logger.debug(`Deleted ${this.model.modelName} with id: ${id}`)
      }
      return result
    } catch (error) {
      logger.error(`Error deleting ${this.model.modelName} with id ${id}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }
}
