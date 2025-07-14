/**
 * Base Repository
 * This abstract class provides a foundation for all repositories
 * implementing common CRUD operations that can be extended by specific repositories.
 */
export class BaseRepository {
  constructor (dao) {
    this.dao = dao
  }

  async getAll (filter = {}, options = {}) {
    return this.dao.getAll(filter, options)
  }

  async getById (id) {
    return this.dao.getById(id)
  }

  async getOne (filter) {
    return this.dao.getOne(filter)
  }

  async create (data) {
    return this.dao.create(data)
  }

  async update (id, data) {
    return this.dao.update(id, data)
  }

  async delete (id) {
    return this.dao.delete(id)
  }
}
