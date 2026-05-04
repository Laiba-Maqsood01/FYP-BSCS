export const validate = (schema, source = "body") => (req, res, next) => {
  
  let data;

  if (source === "body") data = req.body;
  else if (source === "params") data = req.params;
  else if (source === "query") data = req.query;

  const result = schema.safeParse(data);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation Error",
      errors: result.error.issues.map(err => err.message)
    });
  }

  // attach back validated data (important)
  if (source === "body") req.body = result.data;
  if (source === "params") req.params = result.data;
  if (source === "query") req.query = result.data;

  next();
};