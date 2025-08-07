# Imports the base schema for workerd configuration files.

# Refer to the comments in /src/workerd/server/workerd.capnp for more details.

using Workerd = import "/workerd/workerd.capnp";

# A constant of type Workerd.Config defines the top-level configuration for an
# instance of the workerd runtime. A single config file can contain multiple
# Workerd.Config definitions and must have at least one.
const helloWorldExample :Workerd.Config = (

  # Every workerd instance consists of a set of named services. A worker, for instance,
  # is a type of service. Other types of services can include external servers, the
  # ability to talk to a network, or accessing a disk directory. Here we create a single
  # worker service. The configuration details for the worker are defined below.
  services = [
    ( name = "internet", network = ( allow = ["private"] ) ),
    (name = "main", worker = .helloWorld)
    ],

  # Every configuration defines the one or more sockets on which the server will listene.
  # Here, we create a single socket that will listen on localhost port 8080, and will
  # dispatch to the "main" service that we defined above.
  sockets = [ ( name = "http", address = "*:8080", http = (), service = "main" ) ]
);

# The definition of the actual helloWorld worker exposed using the "main" service.
# In this example the worker is implemented as a single simple script (see worker.js).
# The compatibilityDate is required. For more details on compatibility dates see:
#   https://developers.cloudflare.com/workers/platform/compatibility-dates/

const helloWorld :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "worker.js"),
    (name = "application", esModule = embed "application.js"),
    (name = "src/middleware/errorHandler.js", text = embed "src/middleware/errorHandler.js" ),
    (name = "src/config/database.js", text = embed "src/config/database.js" ),
    (name = "src/public/css/main.css", text = embed "src/public/css/main.css" ),
    (name = "src/public/js/main.js", text = embed "src/public/js/main.js" ),
    (name = "src/views/index.handlebars", text = embed "src/views/index.handlebars" ),
    (name = "src/views/layouts/main.handlebars", text = embed "src/views/layouts/main.handlebars" ),
    (name = "src/views/error.handlebars", text = embed "src/views/error.handlebars" ),
    (name = "src/views/partials/taskItem.handlebars", text = embed "src/views/partials/taskItem.handlebars" ),
    (name = "src/routes/tasks.js", text = embed "src/routes/tasks.js" ),
    (name = "src/app.js", text = embed "src/app.js" )
  ],
  compatibilityDate = "2025-07-01",
  compatibilityFlags = [
    "nodejs_compat",
    "enable_nodejs_fs_module",
    "enable_nodejs_http_modules",
    "enable_nodejs_http_server_modules",
    "enable_nodejs_process_v2",
    "enable_nodejs_os_module",
    "experimental",
  ]
);
