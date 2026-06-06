const Setting = require('../models/Setting');

// @desc  Get mandal settings
// @route GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ creditInterestRate: 1, debitInterestRate: 1 });
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

// @desc  Update mandal settings
// @route PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};
