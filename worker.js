import { httpServerHandler } from "cloudflare:node";

import "./application";

export default httpServerHandler({ port: 3000 });
