const Member = require('../models/Member');

// @desc  Get all members (paginated + search)
// @route GET /api/members
exports.getMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', isActive } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { fataNo: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ fataNo: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ success: true, total, page: +page, pages: Math.ceil(total / limit), data: members });
  } catch (err) { next(err); }
};

// @desc  Get single member
// @route GET /api/members/:id
exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// @desc  Create member
// @route POST /api/members
exports.createMember = async (req, res, next) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
};

// @desc  Update member
// @route PUT /api/members/:id
exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// @desc  Delete member
// @route DELETE /api/members/:id
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) { next(err); }
};
