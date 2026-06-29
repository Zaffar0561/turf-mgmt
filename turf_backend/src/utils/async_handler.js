const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      if (typeof next === "function") {
        next(err);
      } else {
        console.error(
          "Error in async handler, but next is not a function:",
          err,
        );
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errors: [],
          data: null,
        });
      }
    });
  };
};

export { asyncHandler };
