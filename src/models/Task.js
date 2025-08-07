const { query } = require('../config/database');

class Task {
  constructor (data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.completed = data.completed || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll () {
    try {
      const result = await query(
        'SELECT * FROM tasks ORDER BY created_at DESC'
      );
      return result.rows.map(row => new Task(row));
    } catch (error) {
      throw new Error(`Error fetching tasks: ${error.message}`);
    }
  }

  static async findById (id) {
    try {
      const result = await query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return new Task(result.rows[0]);
    } catch (error) {
      throw new Error(`Error fetching task: ${error.message}`);
    }
  }

  static async create (taskData) {
    const { title, description } = taskData;

    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required');
    }

    if (title.length > 255) {
      throw new Error('Task title must be 255 characters or less');
    }

    if (description && description.length > 1000) {
      throw new Error('Task description must be 1000 characters or less');
    }

    try {
      const result = await query(
        'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
        [title.trim(), description ? description.trim() : null]
      );
      return new Task(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating task: ${error.message}`);
    }
  }

  async update (updates) {
    const { title, description, completed } = updates;

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new Error('Task title is required');
      }
      if (title.length > 255) {
        throw new Error('Task title must be 255 characters or less');
      }
      this.title = title.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 1000) {
        throw new Error('Task description must be 1000 characters or less');
      }
      this.description = description ? description.trim() : null;
    }

    if (completed !== undefined) {
      this.completed = Boolean(completed);
    }

    try {
      const result = await query(
        'UPDATE tasks SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *',
        [this.title, this.description, this.completed, this.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      const updatedTask = new Task(result.rows[0]);
      Object.assign(this, updatedTask);
      return this;
    } catch (error) {
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  async delete () {
    try {
      const result = await query(
        'DELETE FROM tasks WHERE id = $1 RETURNING *',
        [this.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting task: ${error.message}`);
    }
  }

  async toggleComplete () {
    this.completed = !this.completed;

    try {
      const result = await query(
        'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
        [this.completed, this.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      const updatedTask = new Task(result.rows[0]);
      Object.assign(this, updatedTask);
      return this;
    } catch (error) {
      throw new Error(`Error toggling task completion: ${error.message}`);
    }
  }

  toJSON () {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Task;
