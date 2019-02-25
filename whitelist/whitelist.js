// any url, with the following domains
// not starting with # or ? (we don't allow query hijacking)
module.exports = (origins) => new RegExp(`^[^#?]*(${origins.join('|')}).*`)
