const serializePolicy = (policy) => {
  const p = policy.toObject ? policy.toObject() : policy;
  return {
    _id: p._id,
    title: p.title,
    content: p.content,
    date: p.date,
  };
};

module.exports = { serializePolicy };