import { Apiresponse } from "../utils/api_response.js";

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new Apiresponse(400, null, "No file uploaded"));
  }

  const file = req.file;
  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { filename: file.filename, path: file.path },
        "File uploaded",
      ),
    );
};

export { uploadFile };
