import logger from '../config/logger.config.js'

/**
 * Base repository class that provides common CRUD operations
 */
export class BaseRepository {
  constructor (model) {
    this.model = model
  }

  async findById (id) {
    logger.debug('BaseRepository: Finding document by id', id)
    return this.model.findById(id)
  }

  async findOne (query) {
    logger.debug('BaseRepository: Finding one document with query', query)
    return this.model.findOne(query)
  }

  async find (query = {}, options = {}) {
    logger.debug('BaseRepository: Finding documents with query', query, 'and options', options)
    return this.model.find(query, null, options)
  }

  async create (data) {
    logger.debug('BaseRepository: Creating new document')
    return this.model.create(data)
  }

  async updateById (id, data) {
    logger.debug('BaseRepository: Updating document with id', id)
    return this.model.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteById (id) {
    logger.debug('BaseRepository: Deleting document with id', id)
    return this.model.findByIdAndDelete(id)
  }

  async count (query = {}) {
    logger.debug('BaseRepository: Counting documents with query', query)
    return this.model.countDocuments(query)
  }
}
