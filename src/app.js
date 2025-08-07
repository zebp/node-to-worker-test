const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = 3000;

app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    ifEquals: function (arg1, arg2, options) {
      return (arg1 === arg2) ? options.fn(this) : (options.inverse ? options.inverse(this) : '');
    },
    notEquals: function (arg1, arg2, options) {
      return (arg1 !== arg2) ? options.fn(this) : (options.inverse ? options.inverse(this) : '');
    },
    formatDate: function (date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', taskRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log({ event: 'server_started', port: PORT, timestamp: new Date().toISOString() });
});