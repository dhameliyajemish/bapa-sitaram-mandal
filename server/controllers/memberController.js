const { db } = require('../config/db');



exports.getMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10000, search = '', isActive } = req.query;
    
    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(name LIKE ? OR fataNo LIKE ? OR mobile LIKE ? OR memberId LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (isActive !== undefined) {
      whereClauses.push('isActive = ?');
      params.push(isActive === 'true' ? 1 : 0);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    
    const countQuery = db.prepare(`SELECT COUNT(*) as count FROM members ${whereSql}`);
    const total = countQuery.get(...params).count;

    
    const selectQuery = db.prepare(`
      SELECT * FROM members 
      ${whereSql} 
      ORDER BY CAST(fataNo AS INTEGER) ASC, fataNo ASC 
      LIMIT ? OFFSET ?
    `);
    
    const limitVal = parseInt(limit);
    const offsetVal = (parseInt(page) - 1) * limitVal;
    
    const members = selectQuery.all(...params, limitVal, offsetVal);

    
    const formattedMembers = members.map(m => ({
      ...m,
      _id: m.id,
      isActive: m.isActive === 1
    }));

    res.json({ 
      success: true, 
      total, 
      page: +page, 
      pages: Math.ceil(total / limit), 
      data: formattedMembers 
    });
  } catch (err) { next(err); }
};



exports.getMember = async (req, res, next) => {
  try {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    
    const formattedMember = {
      ...member,
      _id: member.id,
      isActive: member.isActive === 1
    };
    
    res.json({ success: true, data: formattedMember });
  } catch (err) { next(err); }
};



exports.createMember = async (req, res, next) => {
  try {
    const { fataNo, name, mobile, email, openingBalance, familyGroup, isActive } = req.body;
    let { memberId } = req.body;

    
    if (!memberId) {
      const countRes = db.prepare('SELECT COUNT(*) as count FROM members').get();
      memberId = `M-${1000 + countRes.count}`;
    }

    const isActiveVal = isActive === false ? 0 : 1;
    const balanceVal = Number(openingBalance || 0);

    const result = db.prepare(`
      INSERT INTO members (memberId, fataNo, name, mobile, email, openingBalance, familyGroup, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(memberId, fataNo, name, mobile, email || '', balanceVal, familyGroup || '', isActiveVal);

    const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...newMember,
        _id: newMember.id,
        isActive: newMember.isActive === 1
      } 
    });
  } catch (err) { next(err); }
};



exports.updateMember = async (req, res, next) => {
  try {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const fields = ['memberId', 'fataNo', 'name', 'mobile', 'email', 'openingBalance', 'familyGroup', 'isActive'];
    let updateFields = [];
    let params = [];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updateFields.push(`${f} = ?`);
        if (f === 'isActive') {
          params.push(req.body[f] ? 1 : 0);
        } else if (f === 'openingBalance') {
          params.push(Number(req.body[f]));
        } else {
          params.push(req.body[f]);
        }
      }
    });

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(req.params.id);
      db.prepare(`UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedMember = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    res.json({ 
      success: true, 
      data: {
        ...updatedMember,
        _id: updatedMember.id,
        isActive: updatedMember.isActive === 1
      } 
    });
  } catch (err) { next(err); }
};



exports.deleteMember = async (req, res, next) => {
  try {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) { next(err); }
};
