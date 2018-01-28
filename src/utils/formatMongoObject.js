function formatMongoObject (object) {
  object._id = object._id.toString()
  return object
}

export default formatMongoObject
