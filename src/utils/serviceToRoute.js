function serviceToRoute (serviceFunction) {
  return (req, res, next) => {
    return serviceFunction(req.body, req.user)
      .then(serviceResult => res.json(serviceResult))
      .then(() => next())
      .catch(next)
  }
}

export default serviceToRoute
