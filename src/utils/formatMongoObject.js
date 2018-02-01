function formatMongoObject(object) {
  return {
    ...object,
    _id: object._id.toString(), // eslint-disable-line no-underscore-dangle
  }
}

export default formatMongoObject
