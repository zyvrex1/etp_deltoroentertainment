const serializeAnnouncement = (announcement) => {
  const a = announcement.toObject ? announcement.toObject() : announcement;
  return {
    _id: a._id,
    title: a.title,
    date: a.date,
    content: a.content,
    contentcategory: a.contentcategory,
  };
};

module.exports = { serializeAnnouncement };