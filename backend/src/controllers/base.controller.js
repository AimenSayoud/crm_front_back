/**
 * Base Controller - Contains common CRUD operations for MongoDB models
 */
class BaseController {
  /**
   * Create a new BaseController
   * @param {Model} model - Mongoose model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Get all documents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAll = async (req, res) => {
    try {
      // Get query parameters for filtering, pagination, and sorting
      const { page = 1, limit = 10, sort = '-created_at', ...filters } = req.query;
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Build query
      const query = {};
      
      // Add filters - basic implementation, can be extended for specific cases
      Object.keys(filters).forEach(key => {
        if (key !== 'populate') {
          query[key] = filters[key];
        }
      });
      
      // Execute query with pagination
      const items = await this.model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);
      
      // Get total count for pagination
      const total = await this.model.countDocuments(query);
      
      return res.status(200).json({
        data: items,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving data',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      
      let query = this.model.findById(id);
      
      // Handle population if requested
      if (populate) {
        const fields = populate.split(',');
        fields.forEach(field => {
          query = query.populate(field.trim());
        });
      }
      
      const item = await query;
      
      if (!item) {
        return res.status(404).json({
          message: `${this.model.modelName} not found with id ${id}`
        });
      }
      
      return res.status(200).json({ data: item });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving data',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Create a new document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create = async (req, res) => {
    try {
      const newItem = new this.model(req.body);
      const savedItem = await newItem.save();
      
      return res.status(201).json({
        message: `${this.model.modelName} created successfully`,
        data: savedItem
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error creating data',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update a document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Find and update with options
      const updatedItem = await this.model.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true,      // Return updated object
          runValidators: true  // Run model validators
        }
      );
      
      if (!updatedItem) {
        return res.status(404).json({
          message: `${this.model.modelName} not found with id ${id}`
        });
      }
      
      return res.status(200).json({
        message: `${this.model.modelName} updated successfully`,
        data: updatedItem
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating data',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete a document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedItem = await this.model.findByIdAndDelete(id);
      
      if (!deletedItem) {
        return res.status(404).json({
          message: `${this.model.modelName} not found with id ${id}`
        });
      }
      
      return res.status(200).json({
        message: `${this.model.modelName} deleted successfully`,
        data: deletedItem
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error deleting data',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

module.exports = BaseController;