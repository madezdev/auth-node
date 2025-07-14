/**
 * Base DAO (Data Access Object)
 * This abstract class provides the foundation for all data access operations
 * to be implemented by specific model DAOs.
 */
export class BaseDao {
  constructor(model) {
    this.model = model;
  }

  async getAll(filter = {}, options = {}) {
    return this.model.find(filter, null, options);
  }

  async getById(id) {
    return this.model.findById(id);
  }

  async getOne(filter) {
    return this.model.findOne(filter);
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }
}
