import { Apiresponse } from "../utils/api_response.js";

import { asyncHandler } from "../utils/async_handler.js";

const healthcheck = asyncHandler(async (req, res) => {
  res.status(200).json(new Apiresponse(200, { message: "Server in running" }));
});

export { healthcheck };
