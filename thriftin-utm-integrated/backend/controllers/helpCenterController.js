const { query } = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const categories = await query(`
      SELECT 
        c.*,
        COUNT(f.faq_id) as faq_count
      FROM faq_categories c
      LEFT JOIN faq f ON c.category_id = f.category_id AND f.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.category_id
      ORDER BY c.display_order
    `);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.getFAQs = async (req, res) => {
  try {
    const { category_id, search, featured } = req.query;
    
    let sql = `SELECT * FROM faq WHERE is_active = TRUE`;
    const params = [];
    
    if (category_id) {
      sql += ` AND category_id = ?`;
      params.push(category_id);
    }
    
    if (featured === 'true') {
      sql += ` AND is_featured = TRUE`;
    }
    
    if (search) {
      sql += ` AND MATCH(question, answer) AGAINST(? IN NATURAL LANGUAGE MODE)`;
      params.push(search);
    }
    
    sql += ` ORDER BY display_order, is_featured DESC`;
    
    const faqs = await query(sql, params);
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

exports.getFAQDetail = async (req, res) => {
  try {
    const { faqId } = req.params;
    
    // Increment view count
    await query(`UPDATE faq SET view_count = view_count + 1 WHERE faq_id = ?`, [faqId]);
    
    const faq = await query(`SELECT * FROM faq WHERE faq_id = ?`, [faqId]);
    
    if (faq.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    res.json(faq[0]);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
};

exports.voteFAQ = async (req, res) => {
  try {
    const { faqId } = req.params;
    const { userId, isHelpful } = req.body;
    
    // Check if user already voted
    const existing = await query(`
      SELECT * FROM faq_helpful WHERE faq_id = ? AND user_id = ?
    `, [faqId, userId]);
    
    if (existing.length > 0) {
      await query(`
        UPDATE faq_helpful SET is_helpful = ? WHERE helpful_id = ?
      `, [isHelpful, existing[0].helpful_id]);
    } else {
      await query(`
        INSERT INTO faq_helpful (faq_id, user_id, is_helpful) VALUES (?, ?, ?)
      `, [faqId, userId, isHelpful]);
    }
    
    // Update counts
    const counts = await query(`
      SELECT 
        SUM(CASE WHEN is_helpful = TRUE THEN 1 ELSE 0 END) as helpful,
        SUM(CASE WHEN is_helpful = FALSE THEN 1 ELSE 0 END) as not_helpful
      FROM faq_helpful WHERE faq_id = ?
    `, [faqId]);
    
    await query(`
      UPDATE faq 
      SET helpful_count = ?, not_helpful_count = ?
      WHERE faq_id = ?
    `, [counts[0].helpful, counts[0].not_helpful, faqId]);
    
    res.json({ success: true, helpful: counts[0].helpful, not_helpful: counts[0].not_helpful });
  } catch (error) {
    console.error('Error recording helpful vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { user_id, subject, description, category, priority = 'normal' } = req.body;
    
    const ticket_number = 'TKT-' + new Date().getFullYear() + '-' + 
                         String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/feedback/${req.file.filename}`;
    }
    
    const result = await query(`
      INSERT INTO help_tickets (user_id, ticket_number, subject, description, category, priority, attachment_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [user_id, ticket_number, subject, description, category, priority, attachment_url]);
    
    // Create notification
    await query(`
      INSERT INTO notifications (user_id, notification_type, title, message_preview, priority)
      VALUES (?, 'help_ticket', 'Support Ticket Created', ?, 'normal')
    `, [user_id, `Your ticket ${ticket_number} has been created. We'll respond within 24 hours.`]);
    
    res.json({ 
      success: true, 
      ticket_id: result.insertId, 
      ticket_number,
      message: 'Support ticket created successfully' 
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    let sql = `SELECT * FROM help_tickets WHERE user_id = ?`;
    const params = [userId];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    const tickets = await query(sql, params);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

exports.getTicketDetail = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await query(`SELECT * FROM help_tickets WHERE ticket_id = ?`, [ticketId]);
    
    if (ticket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket[0]);
  } catch (error) {
    console.error('Error fetching ticket detail:', error);
    res.status(500).json({ error: 'Failed to fetch ticket detail' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    
    await query(`UPDATE help_tickets SET status = ? WHERE ticket_id = ?`, [status, ticketId]);
    res.json({ success: true, message: 'Ticket status updated' });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
};

exports.getGuides = async (req, res) => {
  try {
    const guides = [
      {
        guide_id: 1,
        title: 'How to Buy Textbooks on ThriftIn',
        description: 'Complete guide for first-time buyers',
        icon: '📖',
        category: 'buying'
      },
      {
        guide_id: 2,
        title: 'Selling Your Textbooks Successfully',
        description: 'Tips for getting the best price',
        icon: '💰',
        category: 'selling'
      },
      {
        guide_id: 3,
        title: 'Staying Safe on ThriftIn',
        description: 'Security tips for transactions',
        icon: '🛡️',
        category: 'safety'
      }
    ];
    res.json(guides);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
};

exports.getGuideDetail = async (req, res) => {
  try {
    const { guideId } = req.params;
    
    const guidesContent = {
      1: {
        guide_id: 1,
        title: 'How to Buy Textbooks on ThriftIn',
        content: `
# Complete Buyer's Guide

## Step 1: Search for Your Textbook
- Use the search bar to find your textbook
- Filter by condition, price range, and location
- Browse by course or subject

## Step 2: Contact the Seller
- Send a message via chat
- Ask about condition, meeting location
- Negotiate price if needed

## Step 3: Arrange Meeting
- Choose safe, public campus location
- Verify the book condition in person
- Complete the transaction

## Tips for Success
- Always inspect books before buying
- Meet during daylight hours
- Bring exact change
        `
      }
    };
    
    const guide = guidesContent[guideId];
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    
    res.json(guide);
  } catch (error) {
    console.error('Error fetching guide detail:', error);
    res.status(500).json({ error: 'Failed to fetch guide detail' });
  }
};