const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.findAll();
    res.render('index', {
      title: 'TODO List',
      tasks,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.completed).length,
      pendingTasks: tasks.filter(task => !task.completed).length
    });
  } catch (error) {
    next(error);
  }
});

router.post('/tasks', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim().length === 0) {
      const error = new Error('Task title is required');
      error.statusCode = 400;
      return next(error);
    }

    const task = await Task.create({ title: title.trim(), description: description?.trim() });

    if (req.accepts('json')) {
      return res.status(201).json(task);
    }

    res.redirect('/');
  } catch (error) {
    if (error.message.includes('title is required') ||
        error.message.includes('255 characters') ||
        error.message.includes('1000 characters')) {
      error.statusCode = 400;
    }
    next(error);
  }
});

router.put('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    const updatedTask = await task.update({ title, description, completed });

    if (req.accepts('json')) {
      return res.json(updatedTask);
    }

    res.redirect('/');
  } catch (error) {
    if (error.message.includes('not found')) {
      error.statusCode = 404;
    } else if (error.message.includes('title is required') ||
               error.message.includes('255 characters') ||
               error.message.includes('1000 characters')) {
      error.statusCode = 400;
    }
    next(error);
  }
});

router.delete('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    await task.delete();

    if (req.accepts('json')) {
      return res.status(204).send();
    }

    res.redirect('/');
  } catch (error) {
    if (error.message.includes('not found')) {
      error.statusCode = 404;
    }
    next(error);
  }
});

router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    const updatedTask = await task.toggleComplete();

    if (req.accepts('json')) {
      return res.json(updatedTask);
    }

    res.redirect('/');
  } catch (error) {
    if (error.message.includes('not found')) {
      error.statusCode = 404;
    }
    next(error);
  }
});

module.exports = router;
