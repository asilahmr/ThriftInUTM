-- Seed Data for UTM ThriftIn Communication & Support System
-- database/seed_data.sql

-- Insert Users
INSERT INTO users (user_id, username, email, password_hash, full_name, profile_picture, is_online, user_role) VALUES
(1, 'ai_assistant', 'ai@thriftin.utm.my', '$2a$10$dummyhash', 'AI Shopping Assistant', NULL, TRUE, 'admin'),
(2, 'john_doe', 'john@graduate.utm.my', '$2a$10$dummyhash', 'John Doe', NULL, TRUE, 'student'),
(3, 'ahmad_rahman', 'ahmad@graduate.utm.my', '$2a$10$dummyhash', 'Ahmad Rahman', NULL, FALSE, 'student'),
(4, 'sarah_lee', 'sarah@graduate.utm.my', '$2a$10$dummyhash', 'Sarah Lee', NULL, TRUE, 'student'),
(5, 'kumar_singh', 'kumar@graduate.utm.my', '$2a$10$dummyhash', 'Kumar Singh', NULL, FALSE, 'student'),
(6, 'admin_support', 'support@thriftin.utm.my', '$2a$10$dummyhash', 'Support Team', NULL, TRUE, 'admin'),
(7, 'lisa_tan', 'lisa@graduate.utm.my', '$2a$10$dummyhash', 'Lisa Tan', NULL, TRUE, 'student'),
(8, 'mike_wong', 'mike@graduate.utm.my', '$2a$10$dummyhash', 'Mike Wong', NULL, FALSE, 'student');

-- Insert Conversations
INSERT INTO conversations (conversation_id, participant_1_id, participant_2_id, is_ai_conversation, conversation_status, last_message_at) VALUES
(1, 2, 1, TRUE, 'active', NOW()),
(2, 2, 3, FALSE, 'active', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 2, 4, FALSE, 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 2, 5, FALSE, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 3, 4, FALSE, 'active', DATE_SUB(NOW(), INTERVAL 2 DAYS)),
(6, 7, 2, FALSE, 'active', DATE_SUB(NOW(), INTERVAL 3 HOURS));

-- Insert Messages
INSERT INTO messages (conversation_id, sender_id, message_text, message_type, is_read, created_at) VALUES
-- AI Conversation
(1, 1, 'Hello! I\'m your AI Shopping Assistant 👋\n\nI can help you with:\n• Finding textbooks within your budget\n• Negotiating better prices\n• General buying and selling advice\n\nHow can I assist you today?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1, 2, 'Hi! Can you help me find calculus textbooks under RM50?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1, 1, 'I can help you find textbooks! Here are some options under RM50:\n\n1. Calculus Early Transcendentals - RM45\n2. Essential Calculus - RM38\n3. Calculus Made Easy - RM30\n\nWould you like more details on any of these?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),

-- Regular Conversations
(2, 2, 'Hi Ahmad, is the Data Structures book still available?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 3, 'Yes, it is! Would you like to meet up?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
(2, 2, 'Sure! Let me know when you\'re free.', 'text', FALSE, DATE_SUB(NOW(), INTERVAL 50 MINUTE)),

(3, 4, 'Hi! Interested in your study desk. Is it still for sale?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 2, 'Yes! The desk is in great condition!', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 1 HOUR, 50 MINUTE)),
(3, 4, 'Can we negotiate the price? My budget is RM80', 'text', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR, 45 MINUTE)),

(4, 2, 'Hello, is the Physics textbook available?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 5, 'Yes, it is still available', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),

(6, 7, 'Hi! I saw your listing for the laptop. Can you tell me more about it?', 'text', TRUE, DATE_SUB(NOW(), INTERVAL 3 HOURS)),
(6, 2, 'Sure! It\'s a Dell Inspiron, 2 years old, 8GB RAM, works perfectly', 'text', FALSE, DATE_SUB(NOW(), INTERVAL 2 HOURS, 50 MINUTE));

-- Insert User Notification Preferences
INSERT INTO user_notification_preferences (user_id) VALUES
(1), (2), (3), (4), (5), (6), (7), (8);

-- Insert Notifications
INSERT INTO notifications (user_id, sender_id, conversation_id, notification_type, title, message_preview, is_read, priority, created_at) VALUES
(2, 4, 3, 'new_message', 'New message from Sarah Lee', 'Can we negotiate the price? My budget is RM80', FALSE, 'normal', DATE_SUB(NOW(), INTERVAL 1 HOUR, 45 MINUTE)),
(2, 7, 6, 'new_message', 'New message from Lisa Tan', 'I saw your listing for the laptop...', FALSE, 'normal', DATE_SUB(NOW(), INTERVAL 3 HOURS)),
(2, NULL, NULL, 'system_update', 'New Feature: Enhanced Search', 'We\'ve added advanced search filters to help you find books faster!', TRUE, 'low', DATE_SUB(NOW(), INTERVAL 2 DAYS)),
(3, 2, 2, 'new_message', 'New message from John Doe', 'Sure! Let me know when you\'re free.', TRUE, 'normal', DATE_SUB(NOW(), INTERVAL 50 MINUTE));

-- Insert FAQ Categories
INSERT INTO faq_categories (category_id, category_name, category_icon, display_order, is_active) VALUES
(1, 'Getting Started', '🚀', 1, TRUE),
(2, 'Buying & Selling', '💰', 2, TRUE),
(3, 'Safety & Security', '🛡️', 3, TRUE),
(4, 'Account & Settings', '⚙️', 4, TRUE),
(5, 'Technical Issues', '🔧', 5, TRUE),
(6, 'Payments', '💳', 6, TRUE);

-- Insert FAQs
INSERT INTO faq (category_id, question, answer, display_order, is_featured, tags) VALUES
(1, 'How do I create an account on ThriftIn?', 'To create an account:\n1. Download the ThriftIn app\n2. Click "Sign Up"\n3. Use your UTM email address\n4. Verify your email\n5. Complete your profile\n\nNote: Only @graduate.utm.my and @utm.my emails are accepted.', 1, TRUE, '["account", "signup", "registration"]'),

(1, 'How do I list a textbook for sale?', 'To list a textbook:\n1. Go to "Sell" tab\n2. Take clear photos of your book\n3. Fill in book details (title, author, condition, price)\n4. Add description\n5. Click "Post Listing"\n\nTip: Honest descriptions and good photos get more buyers!', 2, TRUE, '["selling", "listing", "post"]'),

(2, 'How do I negotiate prices with sellers?', 'Negotiation tips:\n1. Be polite and respectful\n2. Research market prices first\n3. Point out any wear or damage\n4. Offer to meet at convenient location\n5. Bundle books for better deals\n6. Be willing to compromise\n\nOur AI Assistant can help with negotiation strategies!', 1, TRUE, '["negotiation", "price", "bargaining"]'),

(2, 'What should I do before meeting a buyer/seller?', 'Safety checklist:\n1. Verify their UTM identity\n2. Meet in public campus locations (library, cafe)\n3. Bring a friend if possible\n4. Inspect item thoroughly\n5. Count money carefully\n6. Trust your instincts\n\nNever share personal banking details or passwords!', 2, TRUE, '["safety", "meeting", "transaction"]'),

(3, 'How do I report a suspicious user?', 'To report a user:\n1. Open chat with the user\n2. Click menu (⋮) in top right\n3. Select "Report User"\n4. Choose reason for report\n5. Provide details\n6. Submit\n\nOur team reviews all reports within 24 hours.', 1, TRUE, '["report", "safety", "suspicious"]'),

(3, 'What are the prohibited items on ThriftIn?', 'Prohibited items:\n• Counterfeit textbooks\n• Illegal materials\n• Weapons or drugs\n• Stolen items\n• Non-UTM related items\n\nViolations result in account suspension.', 2, FALSE, '["prohibited", "rules", "banned"]'),

(4, 'How do I change my notification settings?', 'To manage notifications:\n1. Go to Profile\n2. Click "Settings"\n3. Select "Notifications"\n4. Toggle preferences\n5. Save changes\n\nYou can customize alerts for messages, updates, and more!', 1, FALSE, '["notifications", "settings", "alerts"]'),

(4, 'How do I delete my account?', 'To delete your account:\n1. Go to Profile > Settings\n2. Scroll to "Account Management"\n3. Click "Delete Account"\n4. Confirm deletion\n\nNote: This action is permanent and cannot be undone. All your listings and messages will be removed.', 2, FALSE, '["account", "delete", "removal"]'),

(5, 'The app keeps crashing, what should I do?', 'Troubleshooting steps:\n1. Force close the app\n2. Clear app cache\n3. Check for updates\n4. Restart your phone\n5. Reinstall the app\n\nIf issue persists, contact support with:\n• Device model\n• OS version\n• Error screenshot', 1, FALSE, '["crash", "bug", "technical"]'),

(5, 'I can\'t send messages, how do I fix this?', 'Message issues fix:\n1. Check internet connection\n2. Verify you\'re not blocked\n3. Update app to latest version\n4. Clear app cache\n5. Restart app\n\nStill not working? Contact support.', 2, FALSE, '["messages", "chat", "technical"]'),

(6, 'What payment methods are accepted?', 'Accepted payment methods:\n• Cash (recommended for campus meetups)\n• Online banking transfer\n• E-wallets (Touch \'n Go, GrabPay)\n\nAlways verify payment before handing over items!', 1, TRUE, '["payment", "cash", "transfer"]'),

(6, 'What if I paid but didn\'t receive the item?', 'If you have payment issues:\n1. Contact the seller first\n2. Check your transaction proof\n3. Report to support with evidence\n4. File a dispute if needed\n\nAlways get receipt/proof of payment!', 2, FALSE, '["payment", "dispute", "scam"]');

-- Insert Help Tickets
INSERT INTO help_tickets (user_id, ticket_number, subject, description, category, priority, status) VALUES
(2, 'TKT-2025-0001', 'Cannot upload photos for listing', 'I\'m trying to upload photos for my calculus book but the app keeps showing an error. I tried reinstalling but same issue.', 'technical', 'normal', 'open'),
(3, 'TKT-2025-0002', 'Suspicious user contacted me', 'A user is asking me to send money before meeting. They claim to be selling rare textbooks. Username: fake_seller99', 'safety', 'high', 'in_progress'),
(4, 'TKT-2025-0003', 'How to verify UTM student?', 'I want to verify if a buyer is really a UTM student before selling my expensive engineering books.', 'safety', 'normal', 'resolved');

-- Insert Feedback
INSERT INTO feedback (user_id, feedback_type, title, description, rating, category, platform, app_version, status) VALUES
(2, 'feature_request', 'Add wish list feature', 'It would be great to have a wish list where I can save textbooks I\'m interested in buying later. Maybe with price alerts?', 4, 'features', 'android', '1.0.0', 'under_review'),

(3, 'bug_report', 'Chat notifications not working', 'I\'m not receiving notifications when someone messages me. I checked settings and everything is enabled. Using Android 13.', 3, 'notifications', 'android', '1.0.0', 'in_progress'),

(4, 'improvement', 'Better search filters', 'The search could be improved with filters for book condition, price range, and seller location on campus.', 5, 'search', 'ios', '1.0.0', 'planned'),

(5, 'compliment', 'Great app for UTM students!', 'This app has made it so easy to buy and sell textbooks. I saved RM200 this semester! The AI assistant is really helpful too.', 5, 'general', 'android', '1.0.0', 'completed'),

(7, 'app_rating', 'Love the AI assistant', 'The AI shopping assistant helped me negotiate a better price. Very useful feature!', 5, 'ai_features', 'ios', '1.0.0', 'completed');

-- Insert Feedback Responses
INSERT INTO feedback_responses (feedback_id, responder_id, response_text, is_public) VALUES
(1, 6, 'Thank you for your suggestion! We love the wish list idea and it\'s now in our development roadmap. We\'ll also look into implementing price alerts. Expected release: Sprint 5.', TRUE),

(2, 6, 'We\'re investigating the notification issue on Android 13. Our team has identified a potential fix. Please update to version 1.0.1 when it\'s released next week. Thank you for reporting!', TRUE),

(3, 6, 'Great suggestion! We\'re working on advanced search filters which will include all the options you mentioned. This feature is planned for Sprint 4.', TRUE),

(4, 6, 'Thank you so much for the positive feedback! We\'re thrilled that ThriftIn is helping UTM students save money. Stories like yours motivate our team!', TRUE);

-- Update FAQ view counts and helpful counts
UPDATE faq SET view_count = 145, helpful_count = 128, not_helpful_count = 5 WHERE faq_id = 1;
UPDATE faq SET view_count = 203, helpful_count = 189, not_helpful_count = 8 WHERE faq_id = 2;
UPDATE faq SET view_count = 167, helpful_count = 154, not_helpful_count = 6 WHERE faq_id = 3;
UPDATE faq SET view_count = 234, helpful_count = 219, not_helpful_count = 9 WHERE faq_id = 4;
UPDATE faq SET view_count = 98, helpful_count = 87, not_helpful_count = 7 WHERE faq_id = 5;
UPDATE faq SET view_count = 156, helpful_count = 142, not_helpful_count = 10 WHERE faq_id = 11;